import axios, { type AxiosInstance } from 'axios';

import { getAuthToken } from '../auth/authToken';
import { toast } from '../toast/toastStore';
import { parseApiError } from '../utils/parseApiError';

function registerNetworkErrorToast(error: unknown): void {
  if (axios.isAxiosError(error) && error.response === undefined) {
    const parsed = parseApiError(error);
    toast.error(parsed.title, parsed.description);
  }
}

function attachNetworkErrorInterceptor(client: AxiosInstance): void {
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      registerNetworkErrorToast(error);
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

attachNetworkErrorInterceptor(publicApiClient);
attachNetworkErrorInterceptor(authenticatedApiClient);
