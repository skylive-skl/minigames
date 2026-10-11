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

export interface LoginFormOptions {
  readonly headingId: string;
  readonly onSwitchToRegister: () => void;
}

export interface LoginForm {
  // The whole panel: heading, form and the "switch to Register" line.
  readonly element: HTMLElement;
  readonly form: HTMLFormElement;
  readonly fields: { readonly email: AuthField; readonly password: AuthField };
  readonly submitButton: HTMLButtonElement;
  readonly googleButton: HTMLButtonElement;
  readonly switchButton: HTMLButtonElement;
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

  form.addEventListener('submit', (event) => {
    event.preventDefault();
  });

  return {
    element: createElement('div', {
      className: 'auth-dialog__panel-content',
      children: [heading, subtext, form, switchText.element],
    }),
    form,
    fields: { email, password },
    submitButton,
    googleButton,
    switchButton: switchText.button,
  };
}
