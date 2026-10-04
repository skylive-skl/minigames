import type { LeaderboardEntry } from '@/shared/types/player';
import { apiGet } from './http';
import type { ApiResponse } from './types';

export async function fetchLeaderboard(signal?: AbortSignal): Promise<readonly LeaderboardEntry[]> {
  const response = await apiGet<ApiResponse<readonly LeaderboardEntry[]>>(
    '/leaderboard',
    undefined,
    signal,
  );
  return response.data;
}
