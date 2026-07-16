import axios, { type AxiosError } from 'axios';

export const authenticatedUserFixture = {
  id: '00000000-0000-0000-0000-000000000010',
  email: 'demo@edificios.local',
  displayName: 'Demo User',
  status: 'ACTIVE',
  createdAt: '2026-07-10T08:00:00.000Z',
  actorId: '00000000-0000-0000-0000-000000000020',
} as const;

export function createUnauthorizedAxiosError(): AxiosError {
  return new axios.AxiosError(
    'Unauthorized',
    '401',
    undefined,
    undefined,
    {
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: { headers: new axios.AxiosHeaders() },
      data: {
        title: 'Unauthorized',
        detail: 'Invalid credentials',
        status: 401,
      },
    },
  );
}
