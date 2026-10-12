import type { AppSession } from '@/shared/auth/app-session';
import { getProfileName } from '@/shared/auth/profile';
import { createElement } from '@/shared/lib/dom';
import { createPersonIcon, createSendIcon } from '@/shared/ui/icon/icon';

const MAX_TEXTAREA_HEIGHT = 88;
const GUEST_PLACEHOLDER = 'Log in to write a comment';
// Figma "Comment Composer Textarea", default state.
const USER_PLACEHOLDER = 'Write a comment...';

export interface CommentFormController {
  readonly element: HTMLElement;
  readonly reset: () => void;
  // Guests get a locked form; a signed-in user writes with their initial.
  readonly setSession: (session: AppSession | undefined) => void;
}

// Uppercase first character of the profile name (Figma avatar "U").
function getAvatarLetter(session: AppSession): string {
  return getProfileName(session).charAt(0).toUpperCase();
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
  });

  function setSession(session: AppSession | undefined): void {
    const isGuest = session === undefined;

    textarea.disabled = isGuest;
    submitButton.disabled = isGuest;
    textarea.placeholder = isGuest ? GUEST_PLACEHOLDER : USER_PLACEHOLDER;
    form.classList.toggle('game-details-dialog__comment-form--guest', isGuest);

    if (isGuest) {
      userAvatar.replaceChildren(createPersonIcon());
    } else {
      userAvatar.textContent = getAvatarLetter(session);
    }
  }

  setSession(undefined);

  return {
    element: form,
    reset: (): void => {
      textarea.value = '';
      textarea.style.height = '';
      textarea.style.overflowY = 'hidden';
    },
    setSession,
  };
}
