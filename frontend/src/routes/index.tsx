import { Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from '../auth/ProtectedRoute';
import { DashboardPage } from '../pages/DashboardPage';
import { HomePage } from '../pages/HomePage';
import { IncidentDetailsPage } from '../pages/IncidentDetailsPage';
import { IncidentsPage } from '../pages/IncidentsPage';
import { LoginPage } from '../pages/LoginPage';
import { ROUTES } from './paths';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<HomePage />} path={ROUTES.home} />
      <Route element={<LoginPage />} path={ROUTES.login} />
      <Route element={<IncidentDetailsPage />} path={ROUTES.incidentDetails} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardPage />} path={ROUTES.dashboard} />
        <Route element={<IncidentsPage />} path={ROUTES.incidents} />
      </Route>

      <Route element={<Navigate replace to={ROUTES.home} />} path="*" />
    </Routes>
  );
}
