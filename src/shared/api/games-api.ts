import type { CategorySlug, Game, GameDetails, SortValue } from '@/shared/types/game';
import { apiGet } from './http';
import type { ApiListResponse, ApiResponse, GamesListMeta } from './types';

export const LIBRARY_PAGE_SIZE = 6;

export interface GamesQuery {
  readonly category: CategorySlug;
  readonly sort: SortValue;
  readonly page: number;
}

export type GamesListResponse = ApiListResponse<Game, GamesListMeta>;

export async function fetchFeaturedGames(signal?: AbortSignal): Promise<readonly Game[]> {
  const response = await apiGet<ApiResponse<readonly Game[]>>(
    '/games',
    { featured: 'true' },
    signal,
  );
  return response.data;
}

export function fetchGames(query: GamesQuery, signal?: AbortSignal): Promise<GamesListResponse> {
  return apiGet<GamesListResponse>(
    '/games',
    {
      category: query.category,
      sort: query.sort,
      page: query.page,
      limit: LIBRARY_PAGE_SIZE,
    },
    signal,
  );
}

export async function fetchGameDetails(slug: string, signal?: AbortSignal): Promise<GameDetails> {
  const response = await apiGet<ApiResponse<GameDetails>>(
    `/games/${encodeURIComponent(slug)}`,
    undefined,
    signal,
  );
  return response.data;
}
