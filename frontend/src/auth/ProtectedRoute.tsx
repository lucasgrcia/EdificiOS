import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { AuthBootstrapLoading } from '../components/AuthBootstrapLoading';
import { ROUTES } from '../routes/paths';
import { useAuthContext } from './AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuthContext();
  const location = useLocation();

  if (isInitializing) {
    return <AuthBootstrapLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
