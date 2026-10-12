import { describe, expect, it } from 'vitest';
import type { AppSession } from '@/shared/auth/app-session';
import { createCommentForm } from './game-details-comment-form';

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
