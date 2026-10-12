import { describe, expect, it, vi } from 'vitest';
import { DialogMode } from '@/shared/types/ui';
import { createAuthDialog, type AuthDialogOptions } from './auth-dialog';

function openDialog(
  mode: DialogMode = DialogMode.Login,
  options: AuthDialogOptions = {},
): ReturnType<typeof createAuthDialog> {
  const authDialog = createAuthDialog(options);
  document.body.append(authDialog.element);
  authDialog.open(mode);
  return authDialog;
}

function query(root: Element, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);
  if (element === null) {
    throw new Error(`${selector} is missing`);
  }
  return element;
}

function queryButton(root: Element, selector: string): HTMLButtonElement {
  const element = query(root, selector);
  if (!(element instanceof HTMLButtonElement)) {
    throw new TypeError(`${selector} is not a button`);
  }
  return element;
}

function queryInput(root: Element, selector: string): HTMLInputElement {
  const element = query(root, selector);
  if (!(element instanceof HTMLInputElement)) {
    throw new TypeError(`${selector} is not an input`);
  }
  return element;
}

function visibleForm(dialog: Element): Element {
  return query(dialog, '.auth-dialog__body > .auth-dialog__panel-content:last-child');
}

describe('auth dialog pending lock', () => {
  it('locks every input and action of the active form while pending', () => {
    const authDialog = openDialog();
    const form = visibleForm(authDialog.element);

    authDialog.setPending('submit');

    for (const input of form.querySelectorAll('input')) {
      expect(input.disabled).toBe(true);
    }
    expect(queryButton(form, '.auth-dialog__google-button').disabled).toBe(true);
    expect(queryButton(form, '.auth-dialog__switch-link').disabled).toBe(true);
    expect(queryButton(form, '.auth-dialog__toggle-password').disabled).toBe(true);
    expect(query(form, '.auth-dialog__forgot').getAttribute('aria-disabled')).not.toBeNull();
    for (const tab of authDialog.element.querySelectorAll<HTMLButtonElement>('.auth-dialog__tab')) {
      expect(tab.disabled).toBe(true);
    }
    expect(queryButton(authDialog.element, '.auth-dialog__close').disabled).toBe(true);
  });

  it('shows loading feedback on the submit button', () => {
    const authDialog = openDialog();
    const submit = queryButton(authDialog.element, '.auth-dialog__submit');

    authDialog.setPending('submit');

    expect(submit.disabled).toBe(true);
    expect(submit.getAttribute('aria-busy')).toBe('true');
    expect(submit.textContent).toBe('Signing in…');
    expect(submit.querySelector('.spinner')).not.toBeNull();
  });

  it('shows loading feedback on the Google button for Google sign-in', () => {
    const authDialog = openDialog(DialogMode.Register);
    const google = queryButton(visibleForm(authDialog.element), '.auth-dialog__google-button');

    authDialog.setPending('google');

    expect(google.getAttribute('aria-busy')).toBe('true');
    expect(google.textContent).toBe('Connecting to Google…');
  });

  it('restores labels and controls when the request settles', () => {
    const authDialog = openDialog();
    const form = visibleForm(authDialog.element);
    const submit = queryButton(form, '.auth-dialog__submit');

    authDialog.setPending('submit');
    authDialog.setPending(undefined);

    expect(submit.textContent).toBe('Login');
    expect(submit.hasAttribute('aria-busy')).toBe(false);
    expect(submit.disabled).toBe(true);
    expect(queryInput(form, '#login-email').disabled).toBe(false);
    expect(query(form, '.auth-dialog__forgot').hasAttribute('aria-disabled')).toBe(false);
  });

  it('re-enables submit after the request when the form is valid', () => {
    const authDialog = openDialog();
    const email = queryInput(authDialog.element, '#login-email');
    const password = queryInput(authDialog.element, '#login-password');
    email.value = 'alex@mail.com';
    email.dispatchEvent(new Event('input'));
    password.value = 'secret1';
    password.dispatchEvent(new Event('input'));

    authDialog.setPending('submit');
    authDialog.setPending(undefined);

    expect(queryButton(authDialog.element, '.auth-dialog__submit').disabled).toBe(false);
    expect(email.value).toBe('alex@mail.com');
  });
});

describe('auth dialog closing', () => {
  it('closes on a backdrop click when idle', () => {
    const onClose = vi.fn();
    const authDialog = openDialog(DialogMode.Login, { onClose });

    authDialog.element.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(authDialog.getOpenMode()).toBeUndefined();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('ignores backdrop clicks while pending', () => {
    const onClose = vi.fn();
    const authDialog = openDialog(DialogMode.Login, { onClose });
    authDialog.setPending('submit');

    authDialog.element.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(authDialog.getOpenMode()).toBe(DialogMode.Login);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('cancels Escape while pending and allows it when idle', () => {
    const authDialog = openDialog();

    authDialog.setPending('google');
    const pendingCancel = new Event('cancel', { cancelable: true });
    authDialog.element.dispatchEvent(pendingCancel);
    const pendingKey = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    document.dispatchEvent(pendingKey);

    expect(pendingCancel.defaultPrevented).toBe(true);
    expect(pendingKey.defaultPrevented).toBe(true);

    authDialog.setPending(undefined);
    const idleCancel = new Event('cancel', { cancelable: true });
    authDialog.element.dispatchEvent(idleCancel);

    expect(idleCancel.defaultPrevented).toBe(false);
  });

  it('switches mode through the tabs and reports it', () => {
    const onModeChange = vi.fn();
    const authDialog = openDialog(DialogMode.Login, { onModeChange });
    const [, registerTab] =
      authDialog.element.querySelectorAll<HTMLButtonElement>('.auth-dialog__tab');

    registerTab.click();

    expect(onModeChange).toHaveBeenCalledWith(DialogMode.Register);
    expect(authDialog.getOpenMode()).toBe(DialogMode.Register);
  });
});
