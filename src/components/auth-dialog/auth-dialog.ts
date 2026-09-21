import { AUTH_DIALOG_OPEN_EVENT } from '@/shared/lib/app-events';
import { createElement } from '@/shared/lib/dom';
import {
  createCloseIcon,
  createEmailIcon,
  createEyeIcon,
  createEyeOffIcon,
  createGoogleIcon,
  createLockIcon,
} from '@/shared/ui/icon/icon';
import type { Component } from '@/shared/types/component';
import { DialogMode } from '@/shared/types/ui';
import './auth-dialog.scss';

interface TabButton {
  readonly mode: DialogMode;
  readonly button: HTMLButtonElement;
}

const TAB_LABELS: Readonly<Record<DialogMode, string>> = {
  [DialogMode.Login]: 'Login',
  [DialogMode.Register]: 'Register',
};

function isDialogMode(value: unknown): value is DialogMode {
  return value === DialogMode.Login || value === DialogMode.Register;
}

function createDivider(): HTMLElement {
  return createElement('div', {
    className: 'auth-dialog__divider',
    children: [createElement('span', { text: 'OR' })],
  });
}

function createGoogleButton(label: string): HTMLButtonElement {
  return createElement('button', {
    className: 'auth-dialog__google-button',
    attributes: { type: 'button' },
    children: [createGoogleIcon(), createElement('span', { text: label })],
  });
}

interface FieldOptions {
  readonly id: string;
  readonly label: string;
  readonly type: string;
  readonly autocomplete: string;
  readonly placeholder: string;
  readonly icon: SVGElement;
  readonly withPasswordToggle?: boolean;
}

function createField(options: FieldOptions): HTMLElement {
  const label = createElement('label', {
    className: 'auth-dialog__label',
    text: options.label,
    attributes: { for: options.id },
  });

  const input = createElement('input', {
    className: 'auth-dialog__input',
    attributes: {
      id: options.id,
      name: options.id,
      type: options.type,
      autocomplete: options.autocomplete,
      placeholder: options.placeholder,
    },
  });

  const iconWrap = createElement('span', {
    className: 'auth-dialog__input-icon',
    attributes: { 'aria-hidden': 'true' },
    children: [options.icon],
  });

  const inputWrapChildren: Node[] = [iconWrap, input];

  if (options.withPasswordToggle === true) {
    const eyeIcon = createEyeIcon();
    const toggle = createElement('button', {
      className: 'auth-dialog__toggle-password',
      attributes: { type: 'button', 'aria-label': 'Show password' },
      children: [eyeIcon],
      onClick: () => {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        toggle.replaceChildren(isPassword ? createEyeOffIcon() : createEyeIcon());
        toggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      },
    });

    inputWrapChildren.push(toggle);
  }

  const inputWrap = createElement('div', {
    className: 'auth-dialog__input-wrap',
    children: inputWrapChildren,
  });

  return createElement('div', { className: 'auth-dialog__field', children: [label, inputWrap] });
}

function createLoginForm(onSwitchToRegister: () => void): HTMLElement {
  const heading = createElement('h2', { className: 'auth-dialog__heading', text: 'Welcome Back!' });
  const subtext = createElement('p', {
    className: 'auth-dialog__subtext',
    text: 'Sign in to resume your games and progress.',
  });

  const emailField = createField({
    id: 'login-email',
    label: 'Email Address',
    type: 'email',
    autocomplete: 'email',
    placeholder: 'e.g. alex@minigames.com',
    icon: createEmailIcon(),
  });

  const passwordField = createField({
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
    attributes: { href: '#/home' },
  });

  const submitButton = createElement('button', {
    className: 'auth-dialog__submit',
    text: 'Login',
    attributes: { type: 'submit' },
  });

  const switchLink = createElement('button', {
    className: 'auth-dialog__switch-link',
    text: 'Register',
    attributes: { type: 'button' },
    onClick: onSwitchToRegister,
  });
  const switchText = createElement('p', {
    className: 'auth-dialog__switch-text',
    children: [document.createTextNode("Don't have an account? "), switchLink],
  });

  const form = createElement('form', {
    className: 'auth-dialog__form',
    attributes: { novalidate: '' },
    children: [
      emailField,
      passwordField,
      forgotLink,
      submitButton,
      createDivider(),
      createGoogleButton('Continue with Google'),
    ],
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
  });

  return createElement('div', {
    className: 'auth-dialog__panel-content',
    children: [heading, subtext, form, switchText],
  });
}

export function createAuthDialog(): Component {
  let lastFocusedElement: HTMLElement | undefined;

  const closeButton = createElement('button', {
    className: 'auth-dialog__close',
    attributes: { type: 'button', 'aria-label': 'Close dialog' },
    children: [createCloseIcon()],
    onClick: () => {
      dialog.close();
    },
  });

  function setMode(mode: DialogMode): void {
    for (const tab of tabs) {
      const isActive = tab.mode === mode;
      tab.button.classList.toggle('auth-dialog__tab--active', isActive);
      tab.button.setAttribute('aria-selected', String(isActive));
    }

    const content = mode === DialogMode.Login ? loginPanel : undefined;
    body.replaceChildren(...(content === undefined ? [] : [content]));
  }

  const tabs: readonly TabButton[] = [DialogMode.Login, DialogMode.Register].map((mode) => ({
    mode,
    button: createElement('button', {
      className: 'auth-dialog__tab',
      text: TAB_LABELS[mode],
      attributes: { type: 'button', role: 'tab' },
      onClick: () => {
        setMode(mode);
      },
    }),
  }));

  const tabList = createElement('div', {
    className: 'auth-dialog__tabs',
    attributes: { role: 'tablist' },
    children: tabs.map((tab) => tab.button),
  });

  const loginPanel = createLoginForm(() => {
    setMode(DialogMode.Register);
  });

  const body = createElement('div', { className: 'auth-dialog__body' });

  const panel = createElement('div', {
    className: 'auth-dialog__panel',
    children: [closeButton, tabList, body],
  });

  const dialog = createElement('dialog', { className: 'auth-dialog', children: [panel] });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  dialog.addEventListener('close', () => {
    lastFocusedElement?.focus();
  });

  function handleOpenRequest(event: Event): void {
    const { detail } = event as CustomEvent<unknown>;

    if (!isDialogMode(detail)) {
      return;
    }

    lastFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    setMode(detail);
    dialog.showModal();
  }

  document.addEventListener(AUTH_DIALOG_OPEN_EVENT, handleOpenRequest);
  setMode(DialogMode.Login);

  return {
    element: dialog,
    destroy: (): void => {
      document.removeEventListener(AUTH_DIALOG_OPEN_EVENT, handleOpenRequest);
    },
  };
}
