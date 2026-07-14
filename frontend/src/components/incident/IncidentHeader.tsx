import type { IncidentView } from '../../types/incident';
import { PageTitle } from '../PageTitle';

type IncidentHeaderProps = {
  incident: IncidentView;
};

export function IncidentHeader({ incident }: IncidentHeaderProps) {
  return (
    <PageTitle
      description={`Estado actual: ${incident.status}`}
      title="Detalle de incidencia"
    />
  );
}
