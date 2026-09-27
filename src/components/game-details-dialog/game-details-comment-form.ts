import { createElement } from '@/shared/lib/dom';

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
      placeholder: 'Share your thoughts about this game...',
      'aria-label': 'Write a comment',
    },
  });

  function adjustTextareaHeight(): void {
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT);
    textarea.style.height = `${String(newHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';
  }

  textarea.addEventListener('input', () => {
    adjustTextareaHeight();
  });

  const userAvatar = createElement('div', {
    className: 'game-details-dialog__avatar game-details-dialog__avatar--user',
    attributes: {
      'aria-hidden': 'true',
    },
    text: 'YO',
  });

  const inputRow = createElement('div', {
    className: 'game-details-dialog__comment-input-row',
    children: [userAvatar, textarea],
  });

  const submitButton = createElement('button', {
    className: 'game-details-dialog__button game-details-dialog__button--submit',
    attributes: { type: 'submit' },
    text: 'Submit',
  });

  const formActions = createElement('div', {
    className: 'game-details-dialog__comment-form-actions',
    children: [submitButton],
  });

  const form = createElement('form', {
    className: 'game-details-dialog__comment-form',
    attributes: { 'aria-label': 'Add a comment' },
    children: [inputRow, formActions],
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
