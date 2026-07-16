import { Link } from 'react-router-dom';

import { RecentIncidentsList } from '../components/dashboard/RecentIncidentsList';
import { Card } from '../components/Card';
import { Container } from '../components/Container';
import { ErrorCard } from '../components/ErrorCard';
import { PageTitle } from '../components/PageTitle';
import { Section } from '../components/Section';
import { SkeletonList } from '../components/skeleton/Skeletons';
import { useAuth } from '../hooks/useAuth';
import { useDashboard } from '../hooks/useDashboard';
import { AppLayout } from '../layouts/AppLayout';
import { ROUTES } from '../routes/paths';
import { useToast } from '../toast/ToastContainer';
import { parseApiError } from '../utils/parseApiError';

export function IncidentsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboard({
    actorId: user?.actorId,
    preferCache: true,
  });

  function handleRetry() {
    void refetch();
    toast.info('Reintentando', 'Volviendo a cargar incidencias.');
  }

  const showLoading = isLoading && data === undefined;

  return (
    <AppLayout>
      <Container>
        <Section className="space-y-6">
          <PageTitle
            description="Incidencias operativas disponibles desde el dashboard."
            title="Incidencias"
          />

          {showLoading && (
            <Card>
              <SkeletonList items={4} />
            </Card>
          )}

          {isError && (
            <ErrorCard
              description={parseApiError(error).description}
              onRetry={handleRetry}
              title={parseApiError(error).title}
            />
          )}

          {data !== undefined && !showLoading && (
            <Card>
              <RecentIncidentsList
                emptyAction="dashboard"
                incidents={data.recentIncidents}
              />
              {isFetching && (
                <p className="mt-4 text-xs text-slate-500">Actualizando…</p>
              )}
            </Card>
          )}

          <Link
            className="inline-flex text-sm font-medium text-slate-700 transition hover:text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            to={ROUTES.dashboard}
          >
            Volver al Dashboard
          </Link>
        </Section>
      </Container>
    </AppLayout>
  );
}
