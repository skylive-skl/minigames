import { createElement } from '@/shared/lib/dom';
import { createSendIcon } from '@/shared/ui/icon/icon';

const MAX_TEXTAREA_HEIGHT = 88;

export interface CommentFormController {
  readonly element: HTMLElement;
  readonly reset: () => void;
}

export function createCommentForm(): CommentFormController {
  const textarea = createElement('textarea', {
    className: 'game-details-dialog__comment-input',
    attributes: {
      rows: '1',
      placeholder: 'Write a comment...',
      'aria-label': 'Write a comment',
    },
  });

  function adjustTextareaHeight(): void {
    textarea.style.height = 'auto';
    // scrollHeight excludes the borders, while the height is border-box.
    const borders = textarea.offsetHeight - textarea.clientHeight;
    const contentHeight = textarea.scrollHeight + borders;
    textarea.style.height = `${String(Math.min(contentHeight, MAX_TEXTAREA_HEIGHT))}px`;
    textarea.style.overflowY = contentHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';
  }

  textarea.addEventListener('input', () => {
    adjustTextareaHeight();
  });

  const userAvatar = createElement('div', {
    className: 'game-details-dialog__avatar game-details-dialog__avatar--user',
    attributes: {
      'aria-hidden': 'true',
    },
    text: 'U',
  });

  const submitButton = createElement('button', {
    className: 'game-details-dialog__comment-submit',
    attributes: { type: 'submit', 'aria-label': 'Submit comment' },
    children: [createSendIcon()],
  });

  const form = createElement('form', {
    className: 'game-details-dialog__comment-form',
    attributes: { 'aria-label': 'Add a comment' },
    children: [userAvatar, textarea, submitButton],
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    // Submission is intentionally a no-op per Story 2 requirements
  });

  return {
    element: form,
    reset: (): void => {
      textarea.value = '';
      textarea.style.height = '';
      textarea.style.overflowY = 'hidden';
    },
  };
}
