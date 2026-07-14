const TOKEN_STORAGE_KEY = 'edificios.auth.token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token.trim());
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function hasAuthToken(): boolean {
  const token = getAuthToken();
  return token !== null && token !== '';
}
