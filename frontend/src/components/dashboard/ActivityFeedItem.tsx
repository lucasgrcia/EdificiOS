import { Link } from 'react-router-dom';

import type { ActivityFeedEntryType } from '../../types/dashboard';
import { incidentDetailsPath } from '../../routes/paths';

const typeStyles: Record<
  ActivityFeedEntryType,
  { label: string; className: string }
> = {
  EVENT: { label: 'EV', className: 'bg-slate-100 text-slate-700' },
  INCIDENT: { label: 'IN', className: 'bg-amber-100 text-amber-800' },
  WORK_ORDER: { label: 'WO', className: 'bg-blue-100 text-blue-800' },
  NOTIFICATION: { label: 'NT', className: 'bg-emerald-100 text-emerald-800' },
};

type ActivityFeedItemProps = {
  type: ActivityFeedEntryType;
  title: string;
  description: string;
  timestamp: string;
  incidentId?: string;
};

function formatTimestamp(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function ActivityFeedItem({
  type,
  title,
  description,
  timestamp,
  incidentId,
}: ActivityFeedItemProps) {
  const icon = typeStyles[type];

  const titleContent =
    incidentId !== undefined ? (
      <Link
        className="text-sm font-medium text-slate-900 hover:text-slate-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        to={incidentDetailsPath(incidentId)}
      >
        {title}
      </Link>
    ) : (
      <p className="text-sm font-medium text-slate-900">{title}</p>
    );

  return (
    <li className="flex gap-3 py-4 last:pb-0 sm:gap-4">
      <div
        aria-hidden
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${icon.className}`}
      >
        {icon.label}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          {titleContent}
          <time className="shrink-0 text-xs text-slate-500">
            {formatTimestamp(timestamp)}
          </time>
        </div>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
        {incidentId !== undefined && (
          <Link
            className="mt-2 inline-block text-xs font-medium text-slate-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            to={incidentDetailsPath(incidentId)}
          >
            Ver incidencia
          </Link>
        )}
      </div>
    </li>
  );
}
