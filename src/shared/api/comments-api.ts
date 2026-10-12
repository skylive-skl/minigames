import type { GameComment } from '@/shared/types/game';
import { apiGet } from './http';
import type { ApiListResponse, CommentsMeta, PersonalizedRequestOptions } from './types';

export const LATEST_COMMENTS_LIMIT = 3;

export type CommentsListResponse = ApiListResponse<GameComment, CommentsMeta>;

export function fetchLatestComments(
  slug: string,
  options: PersonalizedRequestOptions = {},
): Promise<CommentsListResponse> {
  return apiGet<CommentsListResponse>(
    `/games/${encodeURIComponent(slug)}/comments`,
    { limit: LATEST_COMMENTS_LIMIT, sort: 'newest', userEmail: options.userEmail },
    options.signal,
  );
}
