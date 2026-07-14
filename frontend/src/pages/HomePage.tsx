import { useQuery } from '@tanstack/react-query';

import { fetchApiInfo } from '../api/info.api';
import { Card } from '../components/Card';
import { Container } from '../components/Container';
import { ErrorCard } from '../components/ErrorCard';
import { PageTitle } from '../components/PageTitle';
import { Section } from '../components/Section';
import { SkeletonCard } from '../components/skeleton/Skeletons';
import { useToast } from '../toast/ToastContainer';
import { parseApiError } from '../utils/parseApiError';
import { AppLayout } from '../layouts/AppLayout';

export function HomePage() {
  const toast = useToast();
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['api-info'],
    queryFn: fetchApiInfo,
  });

  function handleRetry() {
    void refetch();
    toast.info('Reintentando conexión', 'Volviendo a consultar la API.');
  }

  return (
    <AppLayout>
      <Container>
        <Section className="space-y-6">
          <PageTitle
            description="Cliente web consumiendo la API existente de EdificiOS."
            title="EdificiOS"
          />

          {isLoading && <SkeletonCard lines={3} />}

          {isError && (
            <ErrorCard
              description={parseApiError(error).description}
              onRetry={handleRetry}
              title={parseApiError(error).title}
            />
          )}

          {data !== undefined && !isLoading && (
            <Card>
              <dl className="grid gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Nombre
                  </dt>
                  <dd className="mt-1 font-medium text-slate-900">{data.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Versión
                  </dt>
                  <dd className="mt-1 font-medium text-slate-900">{data.version}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Entorno
                  </dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {data.environment}
                  </dd>
                </div>
              </dl>
              {isFetching && (
                <p className="mt-4 text-xs text-slate-500">Actualizando...</p>
              )}
            </Card>
          )}
        </Section>
      </Container>
    </AppLayout>
  );
}
