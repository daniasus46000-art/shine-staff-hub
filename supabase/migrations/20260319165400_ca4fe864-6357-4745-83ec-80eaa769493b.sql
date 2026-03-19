-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'employee');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'employee',
  UNIQUE(user_id, role)
);

-- Announcements (job assignments)
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deadline DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Attendance (masaroll)
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
  marked_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Planner (schedules)
CREATE TABLE public.planner (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  shift TEXT NOT NULL CHECK (shift IN ('morning', 'evening', 'both')),
  time_slot TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Remarks
CREATE TABLE public.remarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT NOT NULL,
  admin_remark TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Feedback (submissions)
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  feedback_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_planner_updated_at BEFORE UPDATE ON public.planner FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planner ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Profiles: everyone can read, own user can update
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- User roles: readable by all authenticated
CREATE POLICY "Anyone can view roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Announcements: admins CRUD, employees read own
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Employees can view own announcements" ON public.announcements FOR SELECT TO authenticated USING (assigned_to = auth.uid());

-- Attendance: admins CRUD, employees read own
CREATE POLICY "Admins can manage attendance" ON public.attendance FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Employees can view own attendance" ON public.attendance FOR SELECT TO authenticated USING (employee_id = auth.uid());

-- Planner: admins CRUD, employees read/insert/update own
CREATE POLICY "Admins can manage planner" ON public.planner FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Employees can view own planner" ON public.planner FOR SELECT TO authenticated USING (employee_id = auth.uid());
CREATE POLICY "Employees can insert own planner" ON public.planner FOR INSERT TO authenticated WITH CHECK (employee_id = auth.uid());
CREATE POLICY "Employees can update own planner" ON public.planner FOR UPDATE TO authenticated USING (employee_id = auth.uid());

-- Remarks: admins CRUD, employees insert own, read own
CREATE POLICY "Admins can manage remarks" ON public.remarks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Employees can view own remarks" ON public.remarks FOR SELECT TO authenticated USING (employee_id = auth.uid());
CREATE POLICY "Employees can insert own remarks" ON public.remarks FOR INSERT TO authenticated WITH CHECK (employee_id = auth.uid());

-- Feedback: admins can read all, employees insert/read own
CREATE POLICY "Admins can manage feedback" ON public.feedback FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Employees can view own feedback" ON public.feedback FOR SELECT TO authenticated USING (employee_id = auth.uid());
CREATE POLICY "Employees can insert own feedback" ON public.feedback FOR INSERT TO authenticated WITH CHECK (employee_id = auth.uid());
