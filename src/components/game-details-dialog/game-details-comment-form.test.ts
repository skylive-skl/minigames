import { describe, expect, it, vi } from 'vitest';
import type { AppSession } from '@/shared/auth/app-session';
import { createCommentForm, validateCommentText } from './game-details-comment-form';

const session: AppSession = {
  displayName: 'cozyGamer',
  email: 'cozy@mail.com',
  authenticatedAt: 0,
};

function partsOf(form: ReturnType<typeof createCommentForm>): {
  textarea: HTMLTextAreaElement;
  submit: HTMLButtonElement;
  avatar: HTMLElement;
} {
  const textarea = form.element.querySelector('textarea');
  const submit = form.element.querySelector<HTMLButtonElement>('button[type="submit"]');
  const avatar = form.element.querySelector<HTMLElement>('.game-details-dialog__avatar--user');
  if (textarea === null || submit === null || avatar === null) {
    throw new Error('Comment form parts are missing');
  }
  return { textarea, submit, avatar };
}

function setScrollHeight(textarea: HTMLTextAreaElement, height: number): void {
  Object.defineProperty(textarea, 'scrollHeight', { configurable: true, value: height });
}

describe('comment form access', () => {
  it('locks the form for guests', () => {
    const form = createCommentForm();
    const { textarea, submit, avatar } = partsOf(form);

    expect(textarea.disabled).toBe(true);
    expect(submit.disabled).toBe(true);
    expect(textarea.placeholder).toBe('Log in to write a comment');
    expect(avatar.querySelector('svg')).not.toBeNull();
  });

  it('unlocks the form with the user initial for a signed-in user', () => {
    const form = createCommentForm();

    form.setSession(session);

    const { textarea, submit, avatar } = partsOf(form);
    expect(textarea.disabled).toBe(false);
    expect(submit.disabled).toBe(false);
    expect(textarea.placeholder).toBe('Write a comment...');
    expect(avatar.textContent).toBe('C');
  });

  it('uses the email name initial when displayName is empty', () => {
    const form = createCommentForm();

    form.setSession({ ...session, displayName: '' });

    expect(partsOf(form).avatar.textContent).toBe('C');
  });

  it('locks the form again after logout', () => {
    const form = createCommentForm();
    form.setSession(session);

    form.setSession(undefined);

    expect(partsOf(form).textarea.disabled).toBe(true);
  });
});

describe('comment textarea', () => {
  it('grows with its content up to the maximum height', () => {
    const form = createCommentForm();
    form.setSession(session);
    const { textarea } = partsOf(form);

    setScrollHeight(textarea, 60);
    textarea.dispatchEvent(new Event('input'));
    expect(textarea.style.height).toBe('60px');
    expect(textarea.style.overflowY).toBe('hidden');

    setScrollHeight(textarea, 140);
    textarea.dispatchEvent(new Event('input'));
    expect(textarea.style.height).toBe('88px');
    expect(textarea.style.overflowY).toBe('auto');
  });

  it('clears the text and the expanded height on reset', () => {
    const form = createCommentForm();
    form.setSession(session);
    const { textarea } = partsOf(form);
    textarea.value = 'Draft';
    setScrollHeight(textarea, 140);
    textarea.dispatchEvent(new Event('input'));

    form.reset();

    expect(textarea.value).toBe('');
    expect(textarea.style.height).toBe('');
    expect(textarea.style.overflowY).toBe('hidden');
  });
});

function hintOf(form: ReturnType<typeof createCommentForm>): string | undefined {
  const hint = form.element.querySelector<HTMLElement>('.game-details-dialog__comment-hint');
  return hint === null || hint.hidden ? undefined : hint.textContent;
}

function createSignedInForm(onSubmit = vi.fn()): ReturnType<typeof createCommentForm> {
  const form = createCommentForm({ onSubmit });
  document.body.append(form.element);
  form.setSession(session);
  return form;
}

function pressEnter(textarea: HTMLTextAreaElement, isShiftPressed = false): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key: 'Enter',
    shiftKey: isShiftPressed,
    cancelable: true,
  });
  textarea.dispatchEvent(event);
  return event;
}

describe('validateCommentText', () => {
  it('accepts 1–500 characters', () => {
    expect(validateCommentText('a')).toBeUndefined();
    expect(validateCommentText('a'.repeat(500))).toBeUndefined();
  });

  it('rejects empty and too long text', () => {
    expect(validateCommentText('')).toBe('Write something before sending.');
    expect(validateCommentText('a'.repeat(501))).toBe('Comments are limited to 500 characters.');
  });
});

describe('comment submission', () => {
  it('sends the trimmed text with the Send button', () => {
    const onSubmit = vi.fn();
    const form = createSignedInForm(onSubmit);
    partsOf(form).textarea.value = '   Such a calm game!  ';

    partsOf(form).submit.click();

    expect(onSubmit).toHaveBeenCalledWith('Such a calm game!');
  });

  it('sends with Enter and keeps Shift+Enter for new lines', () => {
    const onSubmit = vi.fn();
    const form = createSignedInForm(onSubmit);
    const { textarea } = partsOf(form);
    textarea.value = 'Line one';

    const shiftEnter = pressEnter(textarea, true);
    expect(shiftEnter.defaultPrevented).toBe(false);
    expect(onSubmit).not.toHaveBeenCalled();

    const enter = pressEnter(textarea);
    expect(enter.defaultPrevented).toBe(true);
    expect(onSubmit).toHaveBeenCalledWith('Line one');
  });

  it('rejects whitespace-only and over-long text with an inline hint', () => {
    const onSubmit = vi.fn();
    const form = createSignedInForm(onSubmit);
    const { textarea } = partsOf(form);

    textarea.value = ' '.repeat(4);
    pressEnter(textarea);
    expect(hintOf(form)).toBe('Write something before sending.');

    textarea.value = 'a'.repeat(501);
    pressEnter(textarea);
    expect(hintOf(form)).toBe('Comments are limited to 500 characters.');
    expect(onSubmit).not.toHaveBeenCalled();

    textarea.dispatchEvent(new Event('input'));
    expect(hintOf(form)).toBeUndefined();
  });

  it('locks the textarea and Send button while pending', () => {
    const onSubmit = vi.fn();
    const form = createSignedInForm(onSubmit);
    const { textarea, submit } = partsOf(form);

    form.setPending(true);

    expect(textarea.disabled).toBe(true);
    expect(submit.disabled).toBe(true);
    expect(submit.getAttribute('aria-busy')).toBe('true');
    expect(submit.querySelector('.spinner')).not.toBeNull();

    form.setPending(false);

    expect(textarea.disabled).toBe(false);
    expect(submit.querySelector('.spinner')).toBeNull();
  });

  it('ignores submits from guests', () => {
    const onSubmit = vi.fn();
    const form = createCommentForm({ onSubmit });
    document.body.append(form.element);
    partsOf(form).textarea.value = 'Hello';

    form.element.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
