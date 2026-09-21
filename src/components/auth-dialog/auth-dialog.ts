import { AUTH_DIALOG_OPEN_EVENT } from '@/shared/lib/app-events';
import { createElement } from '@/shared/lib/dom';
import {
  createCloseIcon,
  createEmailIcon,
  createEyeIcon,
  createEyeOffIcon,
  createGoogleIcon,
  createLockIcon,
  createPersonIcon,
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

const HEADING_IDS: Readonly<Record<DialogMode, string>> = {
  [DialogMode.Login]: 'auth-dialog-login-heading',
  [DialogMode.Register]: 'auth-dialog-register-heading',
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function isDialogMode(value: unknown): value is DialogMode {
  return value === DialogMode.Login || value === DialogMode.Register;
}

const TRANSITION_MS = 250;
const pendingCleanups = new WeakMap<HTMLElement, () => void>();

function isReducedMotionPreferred(): boolean {
  return globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Crossfades tab content and animates the container's height from the old
// panel's height to the new one's, measuring the incoming panel as an
// absolutely-positioned overlay so it never affects layout while both
// panels are briefly present together.
function crossfadeContent(container: HTMLElement, nextPanel: HTMLElement): void {
  pendingCleanups.get(container)?.();
  pendingCleanups.delete(container);

  const candidate = container.firstElementChild;

  if (candidate === nextPanel || !(candidate instanceof HTMLElement)) {
    container.replaceChildren(nextPanel);
    return;
  }

  if (isReducedMotionPreferred()) {
    container.replaceChildren(nextPanel);
    return;
  }

  const previousPanel = candidate;

  const startHeight = container.offsetHeight;

  nextPanel.classList.add(
    'auth-dialog__panel-content--overlay',
    'auth-dialog__panel-content--hidden',
  );
  container.append(nextPanel);
  const endHeight = nextPanel.offsetHeight;

  container.style.height = `${String(startHeight)}px`;

  requestAnimationFrame(() => {
    previousPanel.classList.add('auth-dialog__panel-content--hidden');
    nextPanel.classList.remove('auth-dialog__panel-content--hidden');
    container.style.height = `${String(endHeight)}px`;
  });

  function finalize(): void {
    previousPanel.remove();
    nextPanel.classList.remove('auth-dialog__panel-content--overlay');
    container.style.height = '';
    pendingCleanups.delete(container);
  }

  const timeoutId = globalThis.setTimeout(finalize, TRANSITION_MS);

  pendingCleanups.set(container, () => {
    globalThis.clearTimeout(timeoutId);
    finalize();
  });
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
  const heading = createElement('h2', {
    className: 'auth-dialog__heading',
    text: 'Welcome Back!',
    attributes: { id: HEADING_IDS[DialogMode.Login] },
  });
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

function createRegisterForm(onSwitchToLogin: () => void): HTMLElement {
  const heading = createElement('h2', {
    className: 'auth-dialog__heading',
    text: 'Create Account',
    attributes: { id: HEADING_IDS[DialogMode.Register] },
  });
  const subtext = createElement('p', {
    className: 'auth-dialog__subtext',
    text: 'Join MiniGames to track your score & streak.',
  });

  const usernameField = createField({
    id: 'register-username',
    label: 'Username',
    type: 'text',
    autocomplete: 'username',
    placeholder: 'e.g. CozyGamer_99',
    icon: createPersonIcon(),
  });

  const emailField = createField({
    id: 'register-email',
    label: 'Email Address',
    type: 'email',
    autocomplete: 'email',
    placeholder: 'your.email@domain.com',
    icon: createEmailIcon(),
  });

  const passwordField = createField({
    id: 'register-password',
    label: 'Password',
    type: 'password',
    autocomplete: 'new-password',
    placeholder: 'Min. 8 characters',
    icon: createLockIcon(),
  });

  const confirmPasswordField = createField({
    id: 'register-confirm-password',
    label: 'Confirm Password',
    type: 'password',
    autocomplete: 'new-password',
    placeholder: 'Repeat your password',
    icon: createLockIcon(),
  });

  const submitButton = createElement('button', {
    className: 'auth-dialog__submit',
    text: 'Create Account',
    attributes: { type: 'submit' },
  });

  const switchLink = createElement('button', {
    className: 'auth-dialog__switch-link',
    text: 'Login',
    attributes: { type: 'button' },
    onClick: onSwitchToLogin,
  });
  const switchText = createElement('p', {
    className: 'auth-dialog__switch-text',
    children: [document.createTextNode('Already have an account? '), switchLink],
  });

  const form = createElement('form', {
    className: 'auth-dialog__form',
    attributes: { novalidate: '' },
    children: [
      usernameField,
      emailField,
      passwordField,
      confirmPasswordField,
      submitButton,
      createDivider(),
      createGoogleButton('Sign up with Google'),
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

    dialog.setAttribute('aria-labelledby', HEADING_IDS[mode]);

    const content = mode === DialogMode.Login ? loginPanel : registerPanel;
    crossfadeContent(body, content);
  }

  const tabs: readonly TabButton[] = [DialogMode.Login, DialogMode.Register].map((mode) => ({
    mode,
    button: createElement('button', {
      className: 'auth-dialog__tab',
      text: TAB_LABELS[mode],
      attributes: { type: 'button', role: 'tab', 'aria-controls': 'auth-dialog-panel' },
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
  const registerPanel = createRegisterForm(() => {
    setMode(DialogMode.Login);
  });

  const body = createElement('div', {
    className: 'auth-dialog__body',
    attributes: { id: 'auth-dialog-panel', role: 'tabpanel' },
  });

  const panel = createElement('div', {
    className: 'auth-dialog__panel',
    children: [closeButton, tabList, body],
  });

  const dialog = createElement('dialog', {
    className: 'auth-dialog',
    attributes: { 'aria-modal': 'true' },
    children: [panel],
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  dialog.addEventListener('close', () => {
    document.removeEventListener('keydown', handleKeydown);
    lastFocusedElement?.focus();
  });

  function getFocusableElements(): HTMLElement[] {
    return [...panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)];
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return;
    }

    const focusable = getFocusableElements();

    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable.at(-1);

    if (last === undefined) {
      return;
    }

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleOpenRequest(event: Event): void {
    const { detail } = event as CustomEvent<unknown>;

    if (!isDialogMode(detail)) {
      return;
    }

    lastFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    setMode(detail);
    dialog.showModal();
    document.addEventListener('keydown', handleKeydown);
  }

  document.addEventListener(AUTH_DIALOG_OPEN_EVENT, handleOpenRequest);
  setMode(DialogMode.Login);

  return {
    element: dialog,
    destroy: (): void => {
      document.removeEventListener(AUTH_DIALOG_OPEN_EVENT, handleOpenRequest);
      document.removeEventListener('keydown', handleKeydown);
    },
  };
}
