import type { TimelineEntry } from '../../types/incident';
import { EmptyState } from '../EmptyState';
import { TimelineItem } from './TimelineItem';

type TimelineProps = {
  entries: TimelineEntry[];
};

export function Timeline({ entries }: TimelineProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        description="Todavía no hay eventos registrados para esta incidencia."
        icon="timeline"
        title="Timeline vacío"
      />
    );
  }

  return (
    <ol className="ml-1 sm:ml-2">
      {entries.map((entry, index) => (
        <TimelineItem
          key={`${entry.timestamp}-${entry.type}-${index}`}
          entry={entry}
        />
      ))}
    </ol>
  );
}
