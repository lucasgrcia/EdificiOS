import axios, { type AxiosInstance } from 'axios';

import { getAuthToken } from '../auth/authToken';
import { notifyUnauthorized } from '../auth/unauthorizedHandler';
import { toast } from '../toast/toastStore';
import { parseApiError } from '../utils/parseApiError';

function registerNetworkErrorToast(error: unknown): void {
  if (axios.isAxiosError(error) && error.response === undefined) {
    const parsed = parseApiError(error);
    toast.error(parsed.title, parsed.description);
  }
}

function attachResponseInterceptor(client: AxiosInstance, handle401: boolean) {
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (axios.isAxiosError(error)) {
        if (handle401 && error.response?.status === 401) {
          notifyUnauthorized();
        } else if (error.response === undefined) {
          registerNetworkErrorToast(error);
        }
      }

      return Promise.reject(error);
    },
  );
}

export const publicApiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

export const authenticatedApiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

authenticatedApiClient.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token !== null && token !== '') {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

attachResponseInterceptor(publicApiClient, false);
attachResponseInterceptor(authenticatedApiClient, true);
