import { createElement } from '@/shared/lib/dom';
import { createEmailIcon, createLockIcon, createPersonIcon } from '@/shared/ui/icon/icon';
import { createAuthField, type AuthField } from './auth-field';
import {
  createDivider,
  createGoogleButton,
  createSubmitButton,
  createSwitchText,
} from './auth-form-parts';
import { createFormLock, type PendingAction } from './auth-form-lock';
import { createFormValidation, type FormValidation } from './auth-form-validation';
import { validateRegisterForm, type RegisterValues } from './auth-validation';

export interface RegisterFormOptions {
  readonly headingId: string;
  readonly onSwitchToLogin: () => void;
}

export interface RegisterForm {
  readonly element: HTMLElement;
  readonly form: HTMLFormElement;
  readonly fields: {
    readonly username: AuthField;
    readonly email: AuthField;
    readonly password: AuthField;
    readonly confirmPassword: AuthField;
  };
  readonly validation: FormValidation<keyof RegisterValues>;
  readonly submitButton: HTMLButtonElement;
  readonly googleButton: HTMLButtonElement;
  readonly switchButton: HTMLButtonElement;
  readonly setPending: (pending: PendingAction | undefined) => void;
}

export function createRegisterForm(options: RegisterFormOptions): RegisterForm {
  const heading = createElement('h2', {
    className: 'auth-dialog__heading',
    text: 'Create Account',
    attributes: { id: options.headingId },
  });
  const subtext = createElement('p', {
    className: 'auth-dialog__subtext',
    text: 'Join MiniGames to track your score & streak.',
  });

  const username = createAuthField({
    id: 'register-username',
    label: 'Username',
    type: 'text',
    autocomplete: 'username',
    placeholder: 'e.g. CozyGamer99',
    icon: createPersonIcon(),
  });

  const email = createAuthField({
    id: 'register-email',
    label: 'Email Address',
    type: 'email',
    autocomplete: 'email',
    placeholder: 'your.email@domain.com',
    icon: createEmailIcon(),
  });

  const password = createAuthField({
    id: 'register-password',
    label: 'Password',
    type: 'password',
    autocomplete: 'new-password',
    placeholder: 'Min. 6 characters',
    icon: createLockIcon(),
  });

  const confirmPassword = createAuthField({
    id: 'register-confirm-password',
    label: 'Confirm Password',
    type: 'password',
    autocomplete: 'new-password',
    placeholder: 'Repeat your password',
    icon: createLockIcon(),
  });

  const submitButton = createSubmitButton('Create Account');
  const googleButton = createGoogleButton('Sign up with Google');
  const switchText = createSwitchText(
    'Already have an account? ',
    'Login',
    options.onSwitchToLogin,
  );

  const form = createElement('form', {
    className: 'auth-dialog__form',
    attributes: { novalidate: '' },
    children: [
      username.element,
      email.element,
      password.element,
      confirmPassword.element,
      submitButton,
      createDivider(),
      googleButton,
    ],
  });

  const validation = createFormValidation({
    fields: { username, email, password, confirmPassword },
    validate: validateRegisterForm,
    submitButton,
  });

  const setPending = createFormLock({
    fields: [username, email, password, confirmPassword],
    submitButton,
    pendingSubmitLabel: 'Creating account…',
    googleButton,
    pendingGoogleLabel: 'Connecting to Google…',
    actions: [switchText.button],
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
    fields: { username, email, password, confirmPassword },
    validation,
    submitButton,
    googleButton,
    switchButton: switchText.button,
    setPending,
  };
}
