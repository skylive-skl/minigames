import { createElement } from '@/shared/lib/dom';
import { formatRelativeTime } from '@/shared/lib/format';
import type { GameComment } from '@/shared/types/game';
import { createHeartIcon } from '@/shared/ui/icon/icon';

// Avatar fills from the Figma comment cards (2:1478, 2:1490, 2:1502).
const AVATAR_COLORS: readonly string[] = [
  'var(--color-avatar-3)',
  'var(--color-primary)',
  'var(--color-avatar-5)',
];

const GUEST_LIKE_HINT = 'Log in to like comments';

function formatLikes(count: number): string {
  return count === 1 ? '1 like' : `${String(count)} likes`;
}

// Read-only in Story 3: likes are shown but toggling them requires auth (Story 4).
function createCommentItem(comment: GameComment, index: number): HTMLLIElement {
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

  const avatar = createElement('div', {
    className: 'game-details-dialog__avatar',
    attributes: {
      'aria-hidden': 'true',
      style: `background-color: ${avatarColor};`,
    },
    text: comment.authorName.charAt(0).toUpperCase(),
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

  const likeButton = createElement('button', {
    className: `game-details-dialog__comment-like-button${comment.isLikedByCurrentUser ? ' game-details-dialog__comment-like-button--active' : ''}`,
    attributes: {
      type: 'button',
      title: GUEST_LIKE_HINT,
      'aria-label': `${formatLikes(comment.likesCount)}. ${GUEST_LIKE_HINT}`,
    },
    children: [
      heartIcon,
      createElement('span', {
        className: 'game-details-dialog__comment-like-count',
        text: String(comment.likesCount),
      }),
    ],
  });
  likeButton.disabled = true;

  const footer = createElement('div', {
    className: 'game-details-dialog__comment-footer',
    children: [likeButton],
  });

  return createElement('li', {
    className: 'game-details-dialog__comment-item',
    children: [header, text, footer],
  });
}

export function createCommentsList(comments: readonly GameComment[]): HTMLUListElement {
  return createElement('ul', {
    className: 'game-details-dialog__comments-list',
    attributes: { 'aria-label': 'Comments list' },
    children: comments.map((comment, index) => createCommentItem(comment, index)),
  });
}
