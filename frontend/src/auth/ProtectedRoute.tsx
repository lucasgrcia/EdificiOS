import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { ROUTES } from '../routes/paths';
import { useAuthContext } from './AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated } = useAuthContext();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
