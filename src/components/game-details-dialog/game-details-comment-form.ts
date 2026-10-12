import type { AppSession } from '@/shared/auth/app-session';
import { getProfileName } from '@/shared/auth/profile';
import { createElement } from '@/shared/lib/dom';
import { createPersonIcon, createSendIcon } from '@/shared/ui/icon/icon';
import { createSpinner } from '@/shared/ui/spinner/spinner';

const MAX_TEXTAREA_HEIGHT = 88;
const GUEST_PLACEHOLDER = 'Log in to write a comment';
// Figma "Comment Composer Textarea", default state.
const USER_PLACEHOLDER = 'Write a comment...';

export const COMMENT_MAX_LENGTH = 500;

// Text is trimmed first; the API accepts 1–500 characters.
export function validateCommentText(text: string): string | undefined {
  if (text === '') {
    return 'Write something before sending.';
  }
  return text.length > COMMENT_MAX_LENGTH
    ? `Comments are limited to ${String(COMMENT_MAX_LENGTH)} characters.`
    : undefined;
}

export interface CommentFormOptions {
  // Receives the trimmed, valid text.
  readonly onSubmit?: (text: string) => void;
}

export interface CommentFormController {
  readonly element: HTMLElement;
  readonly reset: () => void;
  // Guests get a locked form; a signed-in user writes with their initial.
  readonly setSession: (session: AppSession | undefined) => void;
  // Locks the textarea and the Send button while the comment is being sent.
  readonly setPending: (isPending: boolean) => void;
}

// Uppercase first character of the profile name (Figma avatar "U").
function getAvatarLetter(session: AppSession): string {
  return getProfileName(session).charAt(0).toUpperCase();
}

export function createCommentForm(options: CommentFormOptions = {}): CommentFormController {
  let isSignedIn = false;
  let isPending = false;

  const textarea = createElement('textarea', {
    className: 'game-details-dialog__comment-input',
    attributes: {
      rows: '1',
      placeholder: GUEST_PLACEHOLDER,
      'aria-label': 'Write a comment',
      'aria-describedby': 'game-details-comment-hint',
    },
  });

  const hint = createElement('p', {
    className: 'game-details-dialog__comment-hint',
    attributes: { id: 'game-details-comment-hint', role: 'alert' },
  });
  hint.hidden = true;

  function setHint(message: string | undefined): void {
    hint.textContent = message ?? '';
    hint.hidden = message === undefined;
  }

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
    setHint(undefined);
  });

  // Enter sends, Shift+Enter adds a new line (IME composition is left alone).
  textarea.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) {
      return;
    }
    event.preventDefault();
    form.requestSubmit();
  });

  const userAvatar = createElement('div', {
    className: 'game-details-dialog__avatar game-details-dialog__avatar--user',
    attributes: {
      'aria-hidden': 'true',
    },
  });

  const sendIcon = createSendIcon();
  const submitButton = createElement('button', {
    className: 'game-details-dialog__comment-submit',
    attributes: { type: 'submit', 'aria-label': 'Submit comment' },
    children: [sendIcon],
  });
  const submitSpinner = createSpinner();

  const form = createElement('form', {
    className: 'game-details-dialog__comment-form',
    attributes: { 'aria-label': 'Add a comment' },
    children: [userAvatar, textarea, submitButton, hint],
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!isSignedIn || isPending) {
      return;
    }

    const text = textarea.value.trim();
    const error = validateCommentText(text);
    setHint(error);

    if (error === undefined) {
      options.onSubmit?.(text);
    }
  });

  function updateLock(): void {
    const isLocked = !isSignedIn || isPending;
    textarea.disabled = isLocked;
    submitButton.disabled = isLocked;
    submitButton.setAttribute('aria-busy', String(isPending));
    submitButton.replaceChildren(isPending ? submitSpinner : sendIcon);
  }

  function setSession(session: AppSession | undefined): void {
    const isGuest = session === undefined;

    isSignedIn = !isGuest;
    updateLock();
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
      setHint(undefined);
    },
    setSession,
    setPending: (isSending: boolean): void => {
      isPending = isSending;
      updateLock();
    },
  };
}
