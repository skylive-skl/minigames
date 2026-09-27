import { tukoniComments } from '@/data/comments-tukoni';
import { createElement } from '@/shared/lib/dom';
import type { GameComment } from '@/shared/types/game';
import { createHeartIcon } from '@/shared/ui/icon/icon';

const AVATAR_COLORS: readonly string[] = [
  'var(--color-avatar-2)',
  'var(--color-avatar-3)',
  'var(--color-avatar-4)',
];

function formatCommentDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export interface CommentsListController {
  readonly element: HTMLElement;
  readonly reset: () => void;
}

export function createCommentsList(
  comments: readonly GameComment[] = tukoniComments,
): CommentsListController {
  const resetCommentLikeCallbacks: (() => void)[] = [];

  const commentItems = comments.map((comment, index) => {
    let isLiked = comment.isLikedByCurrentUser;
    const baseLikes = comment.likesCount;

    const initialLetter = comment.authorName.charAt(0).toUpperCase();
    const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

    const avatar = createElement('div', {
      className: 'game-details-dialog__avatar',
      attributes: {
        'aria-hidden': 'true',
        style: `background-color: ${avatarColor};`,
      },
      text: initialLetter,
    });

    const author = createElement('span', {
      className: 'game-details-dialog__comment-author',
      text: comment.authorName,
    });

    const date = createElement('time', {
      className: 'game-details-dialog__comment-date',
      attributes: { datetime: comment.createdAt },
      text: formatCommentDate(comment.createdAt),
    });

    const meta = createElement('div', {
      className: 'game-details-dialog__comment-meta',
      children: [author, date],
    });

    const header = createElement('div', {
      className: 'game-details-dialog__comment-header',
      children: [avatar, meta],
    });

    const text = createElement('p', {
      className: 'game-details-dialog__comment-text',
      text: comment.text,
    });

    const heartIcon = createHeartIcon();
    heartIcon.classList.add('game-details-dialog__comment-like-icon');

    const countSpan = createElement('span', {
      className: 'game-details-dialog__comment-like-count',
      text: String(baseLikes),
    });

    const likeButton = createElement('button', {
      className: 'game-details-dialog__comment-like-button',
      attributes: {
        type: 'button',
        'aria-label': `Like comment by ${comment.authorName}`,
        'aria-pressed': 'false',
      },
      children: [heartIcon, countSpan],
      onClick: () => {
        isLiked = !isLiked;
        updateLikeUI();
      },
    });

    function updateLikeUI(): void {
      const currentCount = baseLikes + (isLiked ? 1 : 0);
      countSpan.textContent = String(currentCount);
      likeButton.setAttribute('aria-pressed', String(isLiked));
      likeButton.classList.toggle('game-details-dialog__comment-like-button--active', isLiked);
    }

    resetCommentLikeCallbacks.push(() => {
      isLiked = false;
      updateLikeUI();
    });

    const footer = createElement('div', {
      className: 'game-details-dialog__comment-footer',
      children: [likeButton],
    });

    return createElement('li', {
      className: 'game-details-dialog__comment-item',
      children: [header, text, footer],
    });
  });

  const list = createElement('ul', {
    className: 'game-details-dialog__comments-list',
    attributes: { 'aria-label': 'Comments list' },
    children: commentItems,
  });

  return {
    element: list,
    reset: (): void => {
      for (const resetLike of resetCommentLikeCallbacks) {
        resetLike();
      }
    },
  };
}
