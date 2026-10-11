import { describe, expect, it, vi } from 'vitest';
import { DialogMode } from '@/shared/types/ui';
import { createAuthDialog } from './auth-dialog';
import type { AuthField } from './auth-field';
import { createLoginForm } from './login-form';
import { createRegisterForm } from './register-form';

function type(field: AuthField, value: string): void {
  field.input.value = value;
  field.input.dispatchEvent(new Event('input'));
}

function blur(field: AuthField): void {
  field.input.dispatchEvent(new Event('blur'));
}

function errorOf(field: AuthField): string | undefined {
  const errorText = field.element.querySelector<HTMLElement>('.auth-dialog__error');
  return errorText === null || errorText.hidden ? undefined : errorText.textContent;
}

function createLogin(): ReturnType<typeof createLoginForm> {
  return createLoginForm({ headingId: 'login-heading', onSwitchToRegister: vi.fn() });
}

function createRegister(): ReturnType<typeof createRegisterForm> {
  return createRegisterForm({ headingId: 'register-heading', onSwitchToLogin: vi.fn() });
}

function fillValid(register: ReturnType<typeof createRegister>): void {
  type(register.fields.username, 'CozyGamer99');
  type(register.fields.email, 'cozy@mail.com');
  type(register.fields.password, 'Secret1!');
  type(register.fields.confirmPassword, 'Secret1!');
}

function getInput(dialog: HTMLElement, id: string): HTMLInputElement {
  const input = dialog.querySelector<HTMLInputElement>(`#${id}`);
  if (input === null) {
    throw new Error(`Input #${id} is missing`);
  }
  return input;
}

function typeInto(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

describe('login form validation', () => {
  it('starts with a disabled submit and no visible errors', () => {
    const login = createLogin();

    expect(login.submitButton.disabled).toBe(true);
    expect(errorOf(login.fields.email)).toBeUndefined();
    expect(errorOf(login.fields.password)).toBeUndefined();
  });

  it('validates a field while the user types', () => {
    const login = createLogin();

    type(login.fields.email, 'alex');
    expect(errorOf(login.fields.email)).toBe('Enter a valid email address.');

    type(login.fields.email, 'alex@mail.com');
    expect(errorOf(login.fields.email)).toBeUndefined();
  });

  it('shows the required error when the user leaves an empty field', () => {
    const login = createLogin();

    blur(login.fields.password);

    expect(errorOf(login.fields.password)).toBe('Password is required.');
    expect(errorOf(login.fields.email)).toBeUndefined();
  });

  it('enables submit only when every field is valid', () => {
    const login = createLogin();

    type(login.fields.email, 'alex@mail.com');
    expect(login.submitButton.disabled).toBe(true);

    type(login.fields.password, 'abcdef');
    expect(login.submitButton.disabled).toBe(false);

    type(login.fields.password, 'abc');
    expect(login.submitButton.disabled).toBe(true);
  });

  it('does not apply registration strength rules to the login password', () => {
    const login = createLogin();

    type(login.fields.email, 'alex@mail.com');
    type(login.fields.password, 'plainpassword');

    expect(errorOf(login.fields.password)).toBeUndefined();
    expect(login.submitButton.disabled).toBe(false);
  });

  it('reveals every error on a submit attempt', () => {
    const login = createLogin();

    login.form.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(errorOf(login.fields.email)).toBe('Email is required.');
    expect(errorOf(login.fields.password)).toBe('Password is required.');
  });
});

describe('register form validation', () => {
  it('enables submit for a fully valid registration', () => {
    const register = createRegister();

    fillValid(register);

    expect(register.submitButton.disabled).toBe(false);
    expect(register.validation.getValues()).toEqual({
      username: 'CozyGamer99',
      email: 'cozy@mail.com',
      password: 'Secret1!',
      confirmPassword: 'Secret1!',
    });
  });

  it('applies username and password strength rules', () => {
    const register = createRegister();

    type(register.fields.username, 'cozy_gamer');
    type(register.fields.password, 'secret1!');

    expect(errorOf(register.fields.username)).toBe(
      'Username may contain English letters and digits only.',
    );
    expect(errorOf(register.fields.password)).toBe(
      'Password must contain at least one uppercase English letter.',
    );
  });

  it('revalidates confirm password whenever the password changes', () => {
    const register = createRegister();
    fillValid(register);

    type(register.fields.password, 'Secret2!');

    expect(errorOf(register.fields.confirmPassword)).toBe('Passwords do not match.');
    expect(register.submitButton.disabled).toBe(true);

    type(register.fields.password, 'Secret1!');

    expect(errorOf(register.fields.confirmPassword)).toBeUndefined();
    expect(register.submitButton.disabled).toBe(false);
  });

  it('keeps an untouched confirm field quiet while the password is typed', () => {
    const register = createRegister();

    type(register.fields.password, 'Secret1!');

    expect(errorOf(register.fields.confirmPassword)).toBeUndefined();
  });
});

describe('auth dialog mode switch', () => {
  it('clears fields and errors when switching between Login and Register', () => {
    const authDialog = createAuthDialog();
    document.body.append(authDialog.element);
    authDialog.open(DialogMode.Login);
    const email = getInput(authDialog.element, 'login-email');
    typeInto(email, 'not-an-email');

    authDialog.open(DialogMode.Register);
    typeInto(getInput(authDialog.element, 'register-username'), 'lowercase');
    authDialog.open(DialogMode.Login);

    expect(email.value).toBe('');
    expect(email.getAttribute('aria-invalid')).not.toBe('true');
    expect(authDialog.element.querySelector<HTMLElement>('#login-email-error')?.hidden).toBe(true);
    expect(getInput(authDialog.element, 'register-username').value).toBe('');
  });

  it('clears the forms when the dialog closes', () => {
    const authDialog = createAuthDialog();
    document.body.append(authDialog.element);
    authDialog.open(DialogMode.Login);
    typeInto(getInput(authDialog.element, 'login-email'), 'alex@mail.com');

    authDialog.close();

    expect(getInput(authDialog.element, 'login-email').value).toBe('');
  });
});
