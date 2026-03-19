import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import MyJobsTab from '@/components/employee/MyJobsTab';
import MyAvailabilityTab from '@/components/employee/MyAvailabilityTab';
import MyAttendanceTab from '@/components/employee/MyAttendanceTab';
import MyRemarksTab from '@/components/employee/MyRemarksTab';
import { Briefcase, CalendarDays, ClipboardCheck, MessageSquare } from 'lucide-react';

const tabs = [
  { label: 'My Jobs', value: 'jobs', icon: <Briefcase className="h-4 w-4" /> },
  { label: 'Availability', value: 'availability', icon: <CalendarDays className="h-4 w-4" /> },
  { label: 'Attendance', value: 'attendance', icon: <ClipboardCheck className="h-4 w-4" /> },
  { label: 'Remarks', value: 'remarks', icon: <MessageSquare className="h-4 w-4" /> },
];

export default function EmployeeDashboard() {
  const { role, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('jobs');

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (role !== 'employee') return <Navigate to="/" replace />;

  const content: Record<string, JSX.Element> = {
    jobs: <MyJobsTab />,
    availability: <MyAvailabilityTab />,
    attendance: <MyAttendanceTab />,
    remarks: <MyRemarksTab />,
  };

  return (
    <DashboardLayout title="Staff Manager" tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}>
      {content[activeTab]}
    </DashboardLayout>
  );
}
