import { createElement } from '@/shared/lib/dom';
import { formatRelativeTime } from '@/shared/lib/format';
import type { GameComment } from '@/shared/types/game';
import { createHeartIcon } from '@/shared/ui/icon/icon';
import { createSpinner } from '@/shared/ui/spinner/spinner';
import { getAvatarInitial, type AvatarColorPicker } from './comment-avatar';

// Lets the owner drive one comment's like button from server responses.
export interface CommentLikeControl {
  readonly setPending: (isPending: boolean) => void;
  readonly setState: (isLiked: boolean, likesCount: number) => void;
}

export type CommentLikeHandler = (commentId: string, control: CommentLikeControl) => void;

function formatLikes(count: number): string {
  return count === 1 ? '1 like' : `${String(count)} likes`;
}

function createCommentItem(
  comment: GameComment,
  getAvatarColor: AvatarColorPicker,
  onLike: CommentLikeHandler | undefined,
): HTMLLIElement {
  const avatarColor = getAvatarColor(comment.authorName);

  const avatar = createElement('div', {
    className: 'game-details-dialog__avatar',
    attributes: {
      'aria-hidden': 'true',
      style: `background-color: ${avatarColor};`,
    },
    text: getAvatarInitial(comment.authorName),
  });

  const author = createElement('span', {
    className: 'game-details-dialog__comment-author',
    text: comment.authorName,
  });

  const date = createElement('time', {
    className: 'game-details-dialog__comment-date',
    attributes: { datetime: comment.createdAt },
    text: formatRelativeTime(comment.createdAt),
  });

  const authorGroup = createElement('div', {
    className: 'game-details-dialog__comment-author-group',
    children: [avatar, author],
  });

  const header = createElement('div', {
    className: 'game-details-dialog__comment-header',
    children: [authorGroup, date],
  });

  const text = createElement('p', {
    className: 'game-details-dialog__comment-text',
    text: comment.text,
  });

  const heartIcon = createHeartIcon('outline');
  heartIcon.classList.add('game-details-dialog__comment-like-icon');

  const likeCount = createElement('span', {
    className: 'game-details-dialog__comment-like-count',
  });
  const likeSpinner = createSpinner('game-details-dialog__comment-like-icon');

  const likeButton = createElement('button', {
    className: 'game-details-dialog__comment-like-button',
    attributes: { type: 'button' },
    children: [heartIcon, likeCount],
  });

  const likeControl: CommentLikeControl = {
    setPending: (isPending) => {
      likeButton.disabled = isPending;
      likeButton.setAttribute('aria-busy', String(isPending));
      likeButton.replaceChildren(isPending ? likeSpinner : heartIcon, likeCount);
    },
    setState: (isLiked, likesCount) => {
      likeButton.classList.toggle('game-details-dialog__comment-like-button--active', isLiked);
      likeButton.setAttribute('aria-pressed', String(isLiked));
      likeButton.setAttribute('aria-label', `Like comment. ${formatLikes(likesCount)}`);
      likeCount.textContent = String(likesCount);
    },
  };

  likeControl.setState(comment.isLikedByCurrentUser, comment.likesCount);
  likeButton.addEventListener('click', () => {
    onLike?.(comment.commentId, likeControl);
  });

  const footer = createElement('div', {
    className: 'game-details-dialog__comment-footer',
    children: [likeButton],
  });

  return createElement('li', {
    className: 'game-details-dialog__comment-item',
    children: [header, text, footer],
  });
}

export function createCommentsList(
  comments: readonly GameComment[],
  getAvatarColor: AvatarColorPicker,
  onLike?: CommentLikeHandler,
): HTMLUListElement {
  return createElement('ul', {
    className: 'game-details-dialog__comments-list',
    attributes: { 'aria-label': 'Comments list' },
    children: comments.map((comment) => createCommentItem(comment, getAvatarColor, onLike)),
  });
}
