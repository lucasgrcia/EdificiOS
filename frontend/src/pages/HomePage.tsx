import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { fetchApiInfo } from '../api/info.api';
import { Card } from '../components/Card';
import { Container } from '../components/Container';
import { ErrorCard } from '../components/ErrorCard';
import { PageTitle } from '../components/PageTitle';
import { Section } from '../components/Section';
import { SkeletonCard } from '../components/skeleton/Skeletons';
import { useAuth } from '../hooks/useAuth';
import { AppLayout } from '../layouts/AppLayout';
import { ROUTES } from '../routes/paths';
import { useToast } from '../toast/ToastContainer';
import { parseApiError } from '../utils/parseApiError';

const textLinkClassName =
  'inline-flex rounded-md px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

export function HomePage() {
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const { data, isLoading, isError, error, refetch } = useQuery({
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
            description="Explorá el flujo operativo completo desde la interfaz web, sin herramientas externas."
            title="EdificiOS"
          />

          {isLoading && <SkeletonCard lines={2} />}

          {isError && (
            <ErrorCard
              description={parseApiError(error).description}
              onRetry={handleRetry}
              title="Backend no disponible"
            />
          )}

          {data !== undefined && !isLoading && (
            <Card>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-slate-600">
                    Versión{' '}
                    <span className="font-medium text-slate-900">
                      {data.version}
                    </span>
                  </p>
                  <p className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <span
                      aria-hidden
                      className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500"
                    />
                    Backend disponible
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {isAuthenticated ? (
                    <Link
                      className={`${textLinkClassName} bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-900`}
                      to={ROUTES.dashboard}
                    >
                      Ir al Dashboard
                    </Link>
                  ) : (
                    <Link
                      className={`${textLinkClassName} bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-900`}
                      to={ROUTES.login}
                    >
                      Iniciar sesión
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          )}
        </Section>
      </Container>
    </AppLayout>
  );
}
