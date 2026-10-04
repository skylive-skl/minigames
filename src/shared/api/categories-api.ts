import type { Category } from '@/shared/types/game';
import { apiGet } from './http';
import type { ApiResponse } from './types';

export async function fetchCategories(signal?: AbortSignal): Promise<readonly Category[]> {
  const response = await apiGet<ApiResponse<readonly Category[]>>('/categories', undefined, signal);
  return response.data;
}
