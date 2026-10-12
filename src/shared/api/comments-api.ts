import type { GameComment } from '@/shared/types/game';
import { apiGet, apiPost } from './http';
import type {
  ApiListResponse,
  ApiResponse,
  CommentsMeta,
  PersonalizedRequestOptions,
} from './types';

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

export interface NewComment {
  readonly userEmail: string;
  // 2–30 characters (the API trims longer names).
  readonly authorName: string;
  // 1–500 characters after trimming; sanitized server-side.
  readonly text: string;
}

// The 201 response carries only the created comment, not the total count.
export async function postComment(slug: string, comment: NewComment): Promise<GameComment> {
  const response = await apiPost<ApiResponse<GameComment>>(
    `/games/${encodeURIComponent(slug)}/comments`,
    comment,
  );
  return response.data;
}
