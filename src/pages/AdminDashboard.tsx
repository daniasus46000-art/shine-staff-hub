import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import AnnouncementsTab from '@/components/admin/AnnouncementsTab';
import AttendanceTab from '@/components/admin/AttendanceTab';
import PlannerTab from '@/components/admin/PlannerTab';
import RemarksTab from '@/components/admin/RemarksTab';
import SubmissionsTab from '@/components/admin/SubmissionsTab';
import ReportsTab from '@/components/admin/ReportsTab';
import { Megaphone, ClipboardCheck, CalendarDays, MessageSquare, FileText, BarChart3 } from 'lucide-react';

const tabs = [
  { label: 'Announcements', value: 'announcements', icon: <Megaphone className="h-4 w-4" /> },
  { label: 'Masaroll', value: 'attendance', icon: <ClipboardCheck className="h-4 w-4" /> },
  { label: 'Planner', value: 'planner', icon: <CalendarDays className="h-4 w-4" /> },
  { label: 'Remarks', value: 'remarks', icon: <MessageSquare className="h-4 w-4" /> },
  { label: 'Submissions', value: 'submissions', icon: <FileText className="h-4 w-4" /> },
  { label: 'Reports', value: 'reports', icon: <BarChart3 className="h-4 w-4" /> },
];

export default function AdminDashboard() {
  const { role, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('announcements');

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (role !== 'admin') return <Navigate to="/" replace />;

  const content: Record<string, JSX.Element> = {
    announcements: <AnnouncementsTab />,
    attendance: <AttendanceTab />,
    planner: <PlannerTab />,
    remarks: <RemarksTab />,
    submissions: <SubmissionsTab />,
    reports: <ReportsTab />,
  };

  return (
    <DashboardLayout title="Staff Manager" tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}>
      {content[activeTab]}
    </DashboardLayout>
  );
}
