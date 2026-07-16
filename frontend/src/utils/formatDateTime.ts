type FormatDateTimeOptions = {
  dateStyle?: 'short' | 'medium';
};

export function formatDateTime(
  value: string,
  options?: FormatDateTimeOptions,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: options?.dateStyle ?? 'short',
    timeStyle: 'short',
  }).format(date);
}
