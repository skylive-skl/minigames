import type { Game, GameDetails, SortValue } from '@/shared/types/game';
import { apiGet, apiPost } from './http';
import type {
  ApiListResponse,
  ApiResponse,
  GamesListMeta,
  PersonalizedRequestOptions,
} from './types';

export const LIBRARY_PAGE_SIZE = 6;

export interface GamesQuery {
  readonly category: string;
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

export async function fetchGameDetails(
  slug: string,
  options: PersonalizedRequestOptions = {},
): Promise<GameDetails> {
  const response = await apiGet<ApiResponse<GameDetails>>(
    `/games/${encodeURIComponent(slug)}`,
    { userEmail: options.userEmail },
    options.signal,
  );
  return response.data;
}

export interface FavoriteState {
  readonly gameSlug: string;
  readonly isFavorited: boolean;
  readonly likesCount: number;
}

// One endpoint toggles both ways: each successful call flips the state.
export async function toggleFavorite(slug: string, userEmail: string): Promise<FavoriteState> {
  const response = await apiPost<ApiResponse<FavoriteState>>(
    `/games/${encodeURIComponent(slug)}/favorite`,
    { userEmail },
  );
  return response.data;
}
