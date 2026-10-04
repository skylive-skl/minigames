import { createElement } from '@/shared/lib/dom';
import type { GameComment } from '@/shared/types/game';
import { createEmptyState, createErrorBanner } from '@/shared/ui/feedback-state/feedback-state';
import { createSkeleton, createSkeletonList, setBusy } from '@/shared/ui/skeleton/skeleton';
import { createCommentForm } from './game-details-comment-form';
import { createCommentsList } from './game-details-comments-list';

const SKELETON_COMMENTS_COUNT = 3;

export interface GameDetailsCommentsController {
  readonly element: HTMLElement;
  readonly showLoading: () => void;
  readonly showComments: (comments: readonly GameComment[], totalCount: number) => void;
  readonly showError: (message: string, onRetry: () => void) => void;
  readonly reset: () => void;
}

function createSkeletonComment(): HTMLElement {
  return createElement('div', {
    className: 'game-details-dialog__comment-item game-details-dialog__comment-skeleton',
    children: [
      createSkeleton({ shape: 'text', className: 'game-details-dialog__skeleton-line-short' }),
      createSkeleton({ shape: 'text', className: 'game-details-dialog__skeleton-line' }),
    ],
  });
}

export function createGameDetailsComments(): GameDetailsCommentsController {
  const heading = createElement('h3', {
    className: 'game-details-dialog__section-title',
    attributes: {
      id: 'game-details-comments-heading',
    },
    text: 'Comments',
  });

  const form = createCommentForm();
  const content = createElement('div', { className: 'game-details-dialog__comments-content' });

  const section = createElement('section', {
    className: 'game-details-dialog__comments',
    attributes: { 'aria-labelledby': 'game-details-comments-heading' },
    children: [heading, form.element, content],
  });

  return {
    element: section,
    showLoading: (): void => {
      heading.textContent = 'Comments';
      content.replaceChildren(
        ...createSkeletonList(SKELETON_COMMENTS_COUNT, createSkeletonComment),
      );
      setBusy(content, true);
    },
    showComments: (comments: readonly GameComment[], totalCount: number): void => {
      setBusy(content, false);
      heading.textContent = `Comments (${String(totalCount)})`;

      if (comments.length === 0) {
        content.replaceChildren(
          createEmptyState({
            title: 'No comments yet',
            message: 'Be the first to share your thoughts about this game.',
          }),
        );
        return;
      }

      content.replaceChildren(createCommentsList(comments));
    },
    showError: (message: string, onRetry: () => void): void => {
      setBusy(content, false);
      heading.textContent = 'Comments';
      content.replaceChildren(
        createErrorBanner({ title: 'Could not load comments', message, onRetry }),
      );
    },
    reset: (): void => {
      form.reset();
    },
  };
}
