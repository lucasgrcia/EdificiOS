type NotificationItemProps = {
  message: string;
  type: string;
  createdAt: string;
};

function formatCreatedAt(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function NotificationItem({
  message,
  type,
  createdAt,
}: NotificationItemProps) {
  return (
    <li className="border-b border-slate-100 py-4 last:border-b-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900">{message}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
            {type}
          </p>
        </div>
        <time className="shrink-0 text-xs text-slate-500">
          {formatCreatedAt(createdAt)}
        </time>
      </div>
    </li>
  );
}
