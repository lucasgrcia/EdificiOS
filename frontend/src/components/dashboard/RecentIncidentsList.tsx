import { Link } from 'react-router-dom';

import type { DashboardIncidentRef } from '../../types/dashboard';
import { incidentDetailsPath, ROUTES } from '../../routes/paths';
import { formatDateTime } from '../../utils/formatDateTime';
import { EmptyState } from '../EmptyState';

type RecentIncidentsListProps = {
  incidents: DashboardIncidentRef[];
  emptyAction?: 'dashboard' | 'none';
};

const textLinkClassName =
  'inline-flex text-sm font-medium text-slate-700 transition hover:text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2';

export function RecentIncidentsList({
  incidents,
  emptyAction = 'none',
}: RecentIncidentsListProps) {
  if (incidents.length === 0) {
    return (
      <EmptyState
        action={
          emptyAction === 'dashboard' ? (
            <Link className={textLinkClassName} to={ROUTES.dashboard}>
              Ir al Dashboard
            </Link>
          ) : undefined
        }
        description="Cuando se detecten incidencias operativas, aparecerán aquí para acceder a su detalle y timeline."
        icon="activity"
        title="Sin incidencias recientes"
      />
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {incidents.map((incident) => (
        <li className="py-4 first:pt-0 last:pb-0" key={incident.id}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <Link
                className="text-sm font-medium text-slate-900 hover:text-slate-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                to={incidentDetailsPath(incident.id)}
              >
                {incident.description}
              </Link>
              <p className="mt-1 text-xs text-slate-500">
                Actor: {incident.actorId}
              </p>
            </div>
            <time className="shrink-0 text-xs text-slate-500">
              {formatDateTime(incident.detectedAt)}
            </time>
          </div>
          <Link
            className={`${textLinkClassName} mt-2`}
            to={incidentDetailsPath(incident.id)}
          >
            Ver detalle y timeline
          </Link>
        </li>
      ))}
    </ul>
  );
}
