import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function Index() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/employee" replace />;
}
