import type {
  ActivityFeedEntry,
  DashboardIncidentRef,
} from '../../types/dashboard';
import { resolveIncidentIdForFeedEntry } from '../../utils/resolveIncidentIdForFeedEntry';
import { EmptyState } from '../EmptyState';
import { ActivityFeedItem } from './ActivityFeedItem';

type ActivityFeedListProps = {
  entries: ActivityFeedEntry[];
  recentIncidents?: DashboardIncidentRef[];
};

function sortByTimestampDesc(entries: ActivityFeedEntry[]): ActivityFeedEntry[] {
  return [...entries].sort((left, right) => {
    return (
      new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
    );
  });
}

export function ActivityFeedList({
  entries,
  recentIncidents = [],
}: ActivityFeedListProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        description="Cuando ocurran eventos operativos, aparecerán aquí en orden cronológico."
        icon="activity"
        title="Sin actividad reciente"
      />
    );
  }

  const sortedEntries = sortByTimestampDesc(entries);

  return (
    <ul className="divide-y divide-slate-100">
      {sortedEntries.map((entry, index) => (
        <ActivityFeedItem
          key={`${entry.type}-${entry.timestamp}-${entry.title}-${index}`}
          description={entry.description}
          incidentId={resolveIncidentIdForFeedEntry(entry, recentIncidents)}
          timestamp={entry.timestamp}
          title={entry.title}
          type={entry.type}
        />
      ))}
    </ul>
  );
}
