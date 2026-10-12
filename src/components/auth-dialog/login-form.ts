import { HOME_HREF } from '@/app/paths';
import { createElement } from '@/shared/lib/dom';
import { createEmailIcon, createLockIcon } from '@/shared/ui/icon/icon';
import { createAuthField, type AuthField } from './auth-field';
import {
  createDivider,
  createGoogleButton,
  createSubmitButton,
  createSwitchText,
} from './auth-form-parts';
import { createFormLock, type PendingAction } from './auth-form-lock';
import { createFormValidation, type FormValidation } from './auth-form-validation';
import { validateLoginForm, type LoginValues } from './auth-validation';

export interface LoginFormOptions {
  readonly headingId: string;
  readonly onSwitchToRegister: () => void;
}

export interface LoginForm {
  readonly element: HTMLElement;
  readonly form: HTMLFormElement;
  readonly fields: { readonly email: AuthField; readonly password: AuthField };
  readonly validation: FormValidation<keyof LoginValues>;
  readonly submitButton: HTMLButtonElement;
  readonly googleButton: HTMLButtonElement;
  readonly switchButton: HTMLButtonElement;
  // Locks every input and action while an auth request is pending.
  readonly setPending: (pending: PendingAction | undefined) => void;
}

export function createLoginForm(options: LoginFormOptions): LoginForm {
  const heading = createElement('h2', {
    className: 'auth-dialog__heading',
    text: 'Welcome Back!',
    attributes: { id: options.headingId },
  });
  const subtext = createElement('p', {
    className: 'auth-dialog__subtext',
    text: 'Sign in to resume your games and progress.',
  });

  const email = createAuthField({
    id: 'login-email',
    label: 'Email Address',
    type: 'email',
    autocomplete: 'email',
    placeholder: 'e.g. alex@minigames.com',
    icon: createEmailIcon(),
  });

  const password = createAuthField({
    id: 'login-password',
    label: 'Password',
    type: 'password',
    autocomplete: 'current-password',
    placeholder: 'Enter your password',
    icon: createLockIcon(),
    withPasswordToggle: true,
  });

  const forgotLink = createElement('a', {
    className: 'auth-dialog__forgot',
    text: 'Forgot Password?',
    attributes: { href: HOME_HREF },
  });

  const submitButton = createSubmitButton('Login');
  const googleButton = createGoogleButton('Continue with Google');
  const switchText = createSwitchText(
    "Don't have an account? ",
    'Register',
    options.onSwitchToRegister,
  );

  const form = createElement('form', {
    className: 'auth-dialog__form',
    attributes: { novalidate: '' },
    children: [
      email.element,
      password.element,
      forgotLink,
      submitButton,
      createDivider(),
      googleButton,
    ],
  });

  const validation = createFormValidation({
    fields: { email, password },
    validate: validateLoginForm,
    submitButton,
  });

  const setPending = createFormLock({
    fields: [email, password],
    submitButton,
    pendingSubmitLabel: 'Signing in…',
    googleButton,
    pendingGoogleLabel: 'Connecting to Google…',
    actions: [switchText.button, forgotLink],
    isValid: validation.isValid,
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    validation.revealAll();
  });

  return {
    element: createElement('div', {
      className: 'auth-dialog__panel-content',
      children: [heading, subtext, form, switchText.element],
    }),
    form,
    fields: { email, password },
    validation,
    submitButton,
    googleButton,
    switchButton: switchText.button,
    setPending,
  };
}
