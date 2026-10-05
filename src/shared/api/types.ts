import type { CategorySlug, SortValue } from '@/shared/types/game';

export interface ApiResponse<T> {
  readonly data: T;
}

export interface ApiListResponse<T, M> {
  readonly data: readonly T[];
  readonly meta: M;
}

export interface GamesListMeta {
  readonly page: number;
  readonly limit: number;
  readonly totalItems: number;
  readonly totalPages: number;
  readonly appliedFilter: {
    readonly category: CategorySlug;
    readonly sort: SortValue;
  };
}

export interface CommentsMeta {
  readonly totalComments: number;
  readonly returnedCount: number;
  readonly sort: string;
}
