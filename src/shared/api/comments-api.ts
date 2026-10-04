import type { GameComment } from '@/shared/types/game';
import { apiGet } from './http';
import type { ApiListResponse, CommentsMeta } from './types';

export const LATEST_COMMENTS_LIMIT = 3;

export type CommentsListResponse = ApiListResponse<GameComment, CommentsMeta>;

export function fetchLatestComments(
  slug: string,
  signal?: AbortSignal,
): Promise<CommentsListResponse> {
  return apiGet<CommentsListResponse>(
    `/games/${encodeURIComponent(slug)}/comments`,
    { limit: LATEST_COMMENTS_LIMIT, sort: 'newest' },
    signal,
  );
}
