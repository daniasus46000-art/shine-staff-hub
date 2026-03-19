import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  tabs: { label: string; value: string; icon: ReactNode }[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function DashboardLayout({ children, title, tabs, activeTab, onTabChange }: DashboardLayoutProps) {
  const { profile, role, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-heading font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground capitalize">{role} Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{profile?.full_name}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="border-b bg-card px-6">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="p-6 max-w-7xl mx-auto animate-fade-in">
        {children}
      </main>
    </div>
  );
}
