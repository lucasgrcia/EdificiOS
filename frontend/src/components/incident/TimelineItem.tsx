import type { TimelineEntry } from '../../types/incident';
import { TimelineDate } from './TimelineDate';
import { TimelineIcon } from './TimelineIcon';

type TimelineItemProps = {
  entry: TimelineEntry;
};

export function TimelineItem({ entry }: TimelineItemProps) {
  return (
    <li className="relative border-l border-slate-200 pb-6 pl-6 last:pb-0 sm:pb-8 sm:pl-8">
      <TimelineIcon type={entry.type} />

      <div className="space-y-2">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <p className="break-words text-sm font-medium text-slate-900">
            {entry.type}
          </p>
          <TimelineDate value={entry.timestamp} />
        </div>

        <p className="break-words text-sm text-slate-600">{entry.description}</p>

        {entry.actorId !== null && (
          <p className="break-all text-xs text-slate-500">
            Actor: <span className="font-mono">{entry.actorId}</span>
          </p>
        )}
      </div>
    </li>
  );
}
