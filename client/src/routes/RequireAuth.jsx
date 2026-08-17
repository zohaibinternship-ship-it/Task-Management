import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import LoadingState from '../components/common/LoadingState.jsx';

export default function RequireAuth({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <LoadingState label="Checking your session..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    const home = user.role === 'employee' ? '/' : '/admin';
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
}
