import { formatDateTime } from '../../utils/formatDateTime';

type TimelineDateProps = {
  value: string;
};

export function TimelineDate({ value }: TimelineDateProps) {
  return (
    <time className="text-xs text-slate-500">
      {formatDateTime(value, { dateStyle: 'medium' })}
    </time>
  );
}
