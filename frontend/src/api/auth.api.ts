import type { AuthenticatedUser } from '../types/auth';
import { authenticatedApiClient } from './client';

export async function fetchCurrentUser(): Promise<AuthenticatedUser> {
  const response =
    await authenticatedApiClient.get<AuthenticatedUser>('/authentication/me');
  return response.data;
}
