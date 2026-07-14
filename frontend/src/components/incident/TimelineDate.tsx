type TimelineDateProps = {
  value: string;
};

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function TimelineDate({ value }: TimelineDateProps) {
  return (
    <time className="text-xs text-slate-500">{formatDate(value)}</time>
  );
}
