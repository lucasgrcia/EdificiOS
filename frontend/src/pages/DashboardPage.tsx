import { Link } from 'react-router-dom';

import { ActivityFeedList } from '../components/dashboard/ActivityFeedList';
import { DashboardMetricCard } from '../components/dashboard/DashboardMetricCard';
import { NotificationList } from '../components/dashboard/NotificationList';
import { RecentIncidentsList } from '../components/dashboard/RecentIncidentsList';
import { Card } from '../components/Card';
import { Container } from '../components/Container';
import { ErrorCard } from '../components/ErrorCard';
import { PageTitle } from '../components/PageTitle';
import { Section } from '../components/Section';
import { SectionTitle } from '../components/SectionTitle';
import {
  DashboardMetricsSkeleton,
  SkeletonList,
} from '../components/skeleton/Skeletons';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../hooks/useAuth';
import { AppLayout } from '../layouts/AppLayout';
import { ROUTES } from '../routes/paths';
import { useToast } from '../toast/ToastContainer';
import { parseApiError } from '../utils/parseApiError';
import type { DashboardSummary } from '../types/dashboard';

const SUMMARY_METRICS: Array<{
  key: keyof DashboardSummary;
  label: string;
}> = [
  { key: 'totalSites', label: 'Total Sites' },
  { key: 'totalAssets', label: 'Total Assets' },
  { key: 'activeShifts', label: 'Active Shifts' },
  { key: 'openIncidents', label: 'Open Incidents' },
  { key: 'inProgressIncidents', label: 'In Progress Incidents' },
  { key: 'resolvedToday', label: 'Resolved Today' },
  { key: 'openWorkOrders', label: 'Open Work Orders' },
  { key: 'completedToday', label: 'Completed Today' },
  { key: 'pendingNotifications', label: 'Pending Notifications' },
];

export function DashboardPage() {
  const toast = useToast();
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useDashboard({
    actorId: user?.actorId,
  });

  function handleRetry() {
    void refetch();
    toast.info('Reintentando', 'Volviendo a cargar el dashboard.');
  }

  return (
    <AppLayout>
      <Container>
        <Section className="space-y-6">
          <PageTitle
            description="Vista operativa en tiempo real desde el backend."
            title="Dashboard"
          />

          {isLoading && (
            <>
              <Section className="space-y-4">
                <SectionTitle>Dashboard Summary</SectionTitle>
                <DashboardMetricsSkeleton />
              </Section>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <SectionTitle>Activity Feed</SectionTitle>
                  <div className="mt-4">
                    <SkeletonList items={4} />
                  </div>
                </Card>
                <Card>
                  <SectionTitle>Notifications</SectionTitle>
                  <div className="mt-4">
                    <SkeletonList items={3} />
                  </div>
                </Card>
              </div>
            </>
          )}

          {isError && (
            <ErrorCard
              description={parseApiError(error).description}
              onRetry={handleRetry}
              title={parseApiError(error).title}
            />
          )}

          {data !== undefined && !isLoading && (
            <>
              <Section className="space-y-4">
                <SectionTitle>Dashboard Summary</SectionTitle>
                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                  {SUMMARY_METRICS.map((metric) => (
                    <DashboardMetricCard
                      key={metric.key}
                      label={metric.label}
                      value={data.summary[metric.key]}
                    />
                  ))}
                </div>
              </Section>

              <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
                <Card>
                  <div className="flex items-center justify-between gap-3">
                    <SectionTitle>Incidencias recientes</SectionTitle>
                    <Link
                      className="text-xs font-medium text-slate-700 hover:text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                      to={ROUTES.incidents}
                    >
                      Ver todas
                    </Link>
                  </div>
                  <div className="mt-4">
                    <RecentIncidentsList incidents={data.recentIncidents} />
                  </div>
                </Card>

                <Card>
                  <SectionTitle>Activity Feed</SectionTitle>
                  <div className="mt-4">
                    <ActivityFeedList
                      entries={data.activityFeed}
                      recentIncidents={data.recentIncidents}
                    />
                  </div>
                </Card>

                <Card className="lg:col-span-2">
                  <SectionTitle>Notifications</SectionTitle>
                  <div className="mt-4">
                    <NotificationList notifications={data.notifications} />
                  </div>
                </Card>
              </div>
            </>
          )}
        </Section>
      </Container>
    </AppLayout>
  );
}
