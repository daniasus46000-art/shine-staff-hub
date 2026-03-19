
CREATE TABLE public.work_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL,
  update_text text NOT NULL,
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.work_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage work_updates" ON public.work_updates FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Employees can insert own updates" ON public.work_updates FOR INSERT TO authenticated WITH CHECK (employee_id = auth.uid());
CREATE POLICY "Employees can view own updates" ON public.work_updates FOR SELECT TO authenticated USING (employee_id = auth.uid());

-- Also add unique constraint on attendance for upsert
CREATE UNIQUE INDEX IF NOT EXISTS attendance_employee_date_idx ON public.attendance (employee_id, date);
