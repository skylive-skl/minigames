import { tukoniComments } from '@/data/comments-tukoni';
import { createElement } from '@/shared/lib/dom';
import type { GameComment } from '@/shared/types/game';
import { createCommentForm } from './game-details-comment-form';
import { createCommentsList } from './game-details-comments-list';

export interface GameDetailsCommentsController {
  readonly element: HTMLElement;
  readonly reset: () => void;
}

export function createGameDetailsComments(
  comments: readonly GameComment[] = tukoniComments,
): GameDetailsCommentsController {
  const heading = createElement('h3', {
    className: 'game-details-dialog__comments-title',
    attributes: {
      id: 'game-details-comments-heading',
    },
    text: `Comments (${String(comments.length)})`,
  });

  const form = createCommentForm();
  const list = createCommentsList(comments);

  const section = createElement('section', {
    className: 'game-details-dialog__comments',
    attributes: { 'aria-labelledby': 'game-details-comments-heading' },
    children: [heading, form.element, list.element],
  });

  return {
    element: section,
    reset: (): void => {
      form.reset();
      list.reset();
    },
  };
}
