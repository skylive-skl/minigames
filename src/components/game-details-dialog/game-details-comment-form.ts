import { createElement } from '@/shared/lib/dom';
import { createSendIcon } from '@/shared/ui/icon/icon';

const MAX_TEXTAREA_HEIGHT = 88;
const GUEST_PLACEHOLDER = 'Log in to write a comment';

export interface CommentFormController {
  readonly element: HTMLElement;
  readonly reset: () => void;
}

export function createCommentForm(): CommentFormController {
  const textarea = createElement('textarea', {
    className: 'game-details-dialog__comment-input',
    attributes: {
      rows: '1',
      placeholder: GUEST_PLACEHOLDER,
      'aria-label': 'Write a comment',
    },
  });
  // Posting comments requires auth, which arrives in Story 4.
  textarea.disabled = true;

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
  submitButton.disabled = true;

  const form = createElement('form', {
    className: 'game-details-dialog__comment-form',
    attributes: { 'aria-label': 'Add a comment' },
    children: [userAvatar, textarea, submitButton],
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    // Read-only in Story 3: posting comments is implemented with auth in Story 4.
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
