import type {
  AuthenticatedUser,
  LoginRequest,
  LoginResponse,
} from '../types/auth';
import { authenticatedApiClient, publicApiClient } from './client';

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await publicApiClient.post<LoginResponse>(
    '/authentication/login',
    credentials,
  );

  return response.data;
}

export async function fetchCurrentUser(): Promise<AuthenticatedUser> {
  const response =
    await authenticatedApiClient.get<AuthenticatedUser>('/authentication/me');

  return response.data;
}
