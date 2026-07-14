import axios from 'axios';

import { getAuthToken } from '../auth/authToken';
import { toast } from '../toast/toastStore';
import { parseApiError } from '../utils/parseApiError';

function registerNetworkErrorToast(error: unknown): void {
  if (axios.isAxiosError(error) && error.response === undefined) {
    const parsed = parseApiError(error);
    toast.error(parsed.title, parsed.description);
  }
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

publicApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    registerNetworkErrorToast(error);
    return Promise.reject(error);
  },
);

authenticatedApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    registerNetworkErrorToast(error);
    return Promise.reject(error);
  },
);
