import { describe, expect, it, vi } from 'vitest';
import {
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
  type AuthProfile,
} from '@/shared/auth/auth-service';
import { DialogMode } from '@/shared/types/ui';
import { showSnackbar } from '@/shared/ui/snackbar/snackbar';
import { createAuthDialog, type AuthDialogOptions } from './auth-dialog';

vi.mock('@/shared/auth/auth-service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/auth/auth-service')>()),
  signInWithEmail: vi.fn(),
  registerWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
}));
vi.mock('@/shared/ui/snackbar/snackbar', () => ({ showSnackbar: vi.fn() }));

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

function fill(root: Element, values: Readonly<Record<string, string>>): void {
  for (const [id, value] of Object.entries(values)) {
    const input = queryInput(root, `#${id}`);
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }
}

function submit(root: Element): void {
  query(visibleForm(root), 'form').dispatchEvent(new Event('submit', { cancelable: true }));
}

const profile: AuthProfile = { displayName: 'Alex', email: 'alex@mail.com' };

describe('email and password authentication', () => {
  it('signs in with the entered credentials and closes on success', async () => {
    const pending = Promise.withResolvers<AuthProfile>();
    vi.mocked(signInWithEmail).mockReturnValue(pending.promise);
    const onAuthenticated = vi.fn();
    const authDialog = openDialog(DialogMode.Login, { onAuthenticated });
    fill(authDialog.element, { 'login-email': 'alex@mail.com', 'login-password': 'secret1' });

    submit(authDialog.element);

    expect(signInWithEmail).toHaveBeenCalledWith('alex@mail.com', 'secret1');
    expect(queryInput(authDialog.element, '#login-email').disabled).toBe(true);

    pending.resolve(profile);
    await vi.waitFor(() => {
      expect(onAuthenticated).toHaveBeenCalledWith(profile);
    });
    expect(authDialog.getOpenMode()).toBeUndefined();
  });

  it('sends a single request when submit is triggered twice', () => {
    vi.mocked(signInWithEmail).mockReturnValue(Promise.withResolvers<AuthProfile>().promise);
    const authDialog = openDialog();
    fill(authDialog.element, { 'login-email': 'alex@mail.com', 'login-password': 'secret1' });

    submit(authDialog.element);
    submit(authDialog.element);

    expect(signInWithEmail).toHaveBeenCalledOnce();
  });

  it('does not call Firebase for an invalid form', () => {
    const authDialog = openDialog();
    fill(authDialog.element, { 'login-email': 'alex', 'login-password': '1' });

    submit(authDialog.element);

    expect(signInWithEmail).not.toHaveBeenCalled();
  });

  it('keeps the dialog open, unlocks it and reports the error on failure', async () => {
    vi.mocked(signInWithEmail).mockRejectedValue(
      Object.assign(new Error('bad'), { code: 'auth/invalid-credential' }),
    );
    const onAuthenticated = vi.fn();
    const authDialog = openDialog(DialogMode.Login, { onAuthenticated });
    fill(authDialog.element, { 'login-email': 'alex@mail.com', 'login-password': 'wrong12' });

    submit(authDialog.element);

    await vi.waitFor(() => {
      expect(showSnackbar).toHaveBeenCalledWith({
        message: 'Incorrect email or password.',
        variant: 'error',
      });
    });
    expect(authDialog.getOpenMode()).toBe(DialogMode.Login);
    expect(onAuthenticated).not.toHaveBeenCalled();
    const email = queryInput(authDialog.element, '#login-email');
    expect(email.disabled).toBe(false);
    expect(email.value).toBe('alex@mail.com');
    expect(queryButton(authDialog.element, '.auth-dialog__submit').disabled).toBe(false);
  });

  it('registers with the username saved as the profile name', async () => {
    vi.mocked(registerWithEmail).mockResolvedValue({ ...profile, displayName: 'CozyGamer99' });
    const onAuthenticated = vi.fn();
    const authDialog = openDialog(DialogMode.Register, { onAuthenticated });
    fill(authDialog.element, {
      'register-username': 'CozyGamer99',
      'register-email': 'cozy@mail.com',
      'register-password': 'Secret1!',
      'register-confirm-password': 'Secret1!',
    });

    submit(authDialog.element);

    expect(registerWithEmail).toHaveBeenCalledWith({
      username: 'CozyGamer99',
      email: 'cozy@mail.com',
      password: 'Secret1!',
    });
    await vi.waitFor(() => {
      expect(onAuthenticated).toHaveBeenCalledWith(
        expect.objectContaining({ displayName: 'CozyGamer99' }),
      );
    });
  });
});

function clickGoogle(root: Element): void {
  queryButton(visibleForm(root), '.auth-dialog__google-button').click();
}

describe('Google authentication', () => {
  it.each([DialogMode.Login, DialogMode.Register])(
    'signs in with Google from the %s form and closes on success',
    async (mode) => {
      const pending = Promise.withResolvers<AuthProfile>();
      vi.mocked(signInWithGoogle).mockReturnValue(pending.promise);
      const onAuthenticated = vi.fn();
      const authDialog = openDialog(mode, { onAuthenticated });

      clickGoogle(authDialog.element);

      expect(signInWithGoogle).toHaveBeenCalledOnce();
      const google = queryButton(visibleForm(authDialog.element), '.auth-dialog__google-button');
      expect(google.disabled).toBe(true);
      expect(google.getAttribute('aria-busy')).toBe('true');

      pending.resolve({ ...profile, avatarUrl: 'https://photo.png' });
      await vi.waitFor(() => {
        expect(onAuthenticated).toHaveBeenCalledWith({
          ...profile,
          avatarUrl: 'https://photo.png',
        });
      });
      expect(authDialog.getOpenMode()).toBeUndefined();
    },
  );

  it('blocks other auth actions and closing while Google is pending', () => {
    vi.mocked(signInWithGoogle).mockReturnValue(Promise.withResolvers<AuthProfile>().promise);
    const authDialog = openDialog();
    fill(authDialog.element, { 'login-email': 'alex@mail.com', 'login-password': 'secret1' });

    clickGoogle(authDialog.element);
    submit(authDialog.element);
    authDialog.element.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(signInWithEmail).not.toHaveBeenCalled();
    expect(queryInput(authDialog.element, '#login-email').disabled).toBe(true);
    expect(authDialog.getOpenMode()).toBe(DialogMode.Login);
  });

  it('keeps the dialog open and unlocks it when the popup is closed', async () => {
    vi.mocked(signInWithGoogle).mockRejectedValue(
      Object.assign(new Error('closed'), { code: 'auth/popup-closed-by-user' }),
    );
    const onAuthenticated = vi.fn();
    const authDialog = openDialog(DialogMode.Login, { onAuthenticated });

    clickGoogle(authDialog.element);

    await vi.waitFor(() => {
      expect(showSnackbar).toHaveBeenCalledWith({
        message: 'Google sign-in was cancelled.',
        variant: 'info',
      });
    });
    expect(authDialog.getOpenMode()).toBe(DialogMode.Login);
    expect(onAuthenticated).not.toHaveBeenCalled();
    expect(
      queryButton(visibleForm(authDialog.element), '.auth-dialog__google-button').disabled,
    ).toBe(false);
  });

  it('reports a failed Google sign-in as an error', async () => {
    vi.mocked(signInWithGoogle).mockRejectedValue(
      Object.assign(new Error('offline'), { code: 'auth/network-request-failed' }),
    );
    const authDialog = openDialog();

    clickGoogle(authDialog.element);

    await vi.waitFor(() => {
      expect(showSnackbar).toHaveBeenCalledWith({
        message: 'Network error. Check your connection and try again.',
        variant: 'error',
      });
    });
    expect(authDialog.getOpenMode()).toBe(DialogMode.Login);
  });
});
