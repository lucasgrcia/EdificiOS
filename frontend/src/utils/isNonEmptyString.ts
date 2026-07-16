export function isNonEmptyString(value: string | undefined): boolean {
  return value !== undefined && value.trim() !== '';
}
