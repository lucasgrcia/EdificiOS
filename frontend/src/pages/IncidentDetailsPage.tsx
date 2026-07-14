import { Link, useParams } from 'react-router-dom';

import { Card } from '../components/Card';
import { Container } from '../components/Container';
import { ErrorCard } from '../components/ErrorCard';
import { Section } from '../components/Section';
import { SectionTitle } from '../components/SectionTitle';
import {
  SkeletonCard,
  SkeletonTimeline,
} from '../components/skeleton/Skeletons';
import { IncidentHeader } from '../components/incident/IncidentHeader';
import { IncidentSummaryCard } from '../components/incident/IncidentSummaryCard';
import { Timeline } from '../components/incident/Timeline';
import { useIncident } from '../hooks/useIncident';
import { useIncidentTimeline } from '../hooks/useIncidentTimeline';
import { AppLayout } from '../layouts/AppLayout';
import { ROUTES } from '../routes/paths';
import { useToast } from '../toast/ToastContainer';
import { parseApiError } from '../utils/parseApiError';

export function IncidentDetailsPage() {
  const { incidentId } = useParams<{ incidentId: string }>();
  const toast = useToast();
  const incidentQuery = useIncident(incidentId);
  const timelineQuery = useIncidentTimeline(incidentId);

  const isLoading = incidentQuery.isLoading || timelineQuery.isLoading;
  const isError = incidentQuery.isError || timelineQuery.isError;
  const error = incidentQuery.error ?? timelineQuery.error;

  function handleRetry() {
    void Promise.all([incidentQuery.refetch(), timelineQuery.refetch()]);
    toast.info('Reintentando', 'Volviendo a cargar la incidencia.');
  }

  return (
    <AppLayout>
      <Container>
        <Section className="space-y-6">
          <Link
            className="inline-flex text-sm font-medium text-slate-600 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            to={ROUTES.dashboard}
          >
            ← Volver al dashboard
          </Link>

          {isLoading && (
            <>
              <SkeletonCard lines={2} />
              <SkeletonCard lines={6} />
              <Card>
                <SectionTitle>Timeline</SectionTitle>
                <div className="mt-6">
                  <SkeletonTimeline items={4} />
                </div>
              </Card>
            </>
          )}

          {isError && (
            <ErrorCard
              description={parseApiError(error).description}
              onRetry={handleRetry}
              title={parseApiError(error).title}
            />
          )}

          {incidentQuery.data !== undefined && !isLoading && (
            <>
              <IncidentHeader incident={incidentQuery.data} />

              <Section className="space-y-4">
                <SectionTitle>Información general</SectionTitle>
                <IncidentSummaryCard
                  fields={[
                    { label: 'ID', value: incidentQuery.data.id },
                    { label: 'Status', value: incidentQuery.data.status },
                    { label: 'Priority', value: '—' },
                    {
                      label: 'Description',
                      value: incidentQuery.data.description,
                    },
                    { label: 'Site', value: '—' },
                    { label: 'Actor', value: incidentQuery.data.actorId },
                    {
                      label: 'Created At',
                      value: incidentQuery.data.createdAt,
                    },
                  ]}
                />
              </Section>
            </>
          )}

          {timelineQuery.data !== undefined && !isLoading && (
            <Card>
              <SectionTitle>Timeline</SectionTitle>
              <div className="mt-6">
                <Timeline entries={timelineQuery.data} />
              </div>
            </Card>
          )}
        </Section>
      </Container>
    </AppLayout>
  );
}
