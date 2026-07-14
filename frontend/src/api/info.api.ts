import type { ApiInfo } from '../types/api';
import { publicApiClient } from './client';

export async function fetchApiInfo(): Promise<ApiInfo> {
  const response = await publicApiClient.get<ApiInfo>('/info');
  return response.data;
}
