import { createElement } from '@/shared/lib/dom';
import { createCloseIcon } from '@/shared/ui/icon/icon';
import type { Component } from '@/shared/types/component';
import { DialogMode } from '@/shared/types/ui';
import type { PendingAction } from './auth-form-lock';
import { createLoginForm } from './login-form';
import { createRegisterForm } from './register-form';
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

function lockBodyScroll(): void {
  const scrollbarWidth = globalThis.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = 'hidden';
  document.body.style.paddingRight = scrollbarWidth > 0 ? `${String(scrollbarWidth)}px` : '';
}

function unlockBodyScroll(): void {
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
}

export function isDialogMode(value: unknown): value is DialogMode {
  return value === DialogMode.Login || value === DialogMode.Register;
}

const TRANSITION_MS = 250;
const pendingCleanups = new WeakMap<HTMLElement, () => void>();

function isReducedMotionPreferred(): boolean {
  return globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

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

export interface AuthDialogOptions {
  readonly onClose?: () => void;
  readonly onModeChange?: (mode: DialogMode) => void;
}

export interface AuthDialogComponent extends Component {
  readonly open: (mode: DialogMode) => void;
  readonly close: () => void;
  readonly getOpenMode: () => DialogMode | undefined;
  readonly setPending: (pending: PendingAction | undefined) => void;
}

export function createAuthDialog(options: AuthDialogOptions = {}): AuthDialogComponent {
  let lastFocusedElement: HTMLElement | undefined;
  let currentMode = DialogMode.Login;
  let pendingAction: PendingAction | undefined;

  const closeButton = createElement('button', {
    className: 'auth-dialog__close',
    attributes: { type: 'button', 'aria-label': 'Close dialog' },
    children: [createCloseIcon()],
    onClick: () => {
      requestClose();
    },
  });

  function requestClose(): void {
    if (pendingAction === undefined) {
      dialog.close();
    }
  }

  function setPending(pending: PendingAction | undefined): void {
    pendingAction = pending;
    const isLocked = pending !== undefined;

    closeButton.disabled = isLocked;
    for (const tab of tabs) {
      tab.button.disabled = isLocked;
    }
    loginForm.setPending(currentMode === DialogMode.Login ? pending : undefined);
    registerForm.setPending(currentMode === DialogMode.Register ? pending : undefined);
    panel.setAttribute('aria-busy', String(isLocked));
  }

  function resetForms(): void {
    loginForm.validation.reset();
    registerForm.validation.reset();
  }

  function setMode(mode: DialogMode): void {
    if (mode !== currentMode) {
      resetForms();
    }
    currentMode = mode;
    for (const tab of tabs) {
      const isActive = tab.mode === mode;
      tab.button.classList.toggle('auth-dialog__tab--active', isActive);
      tab.button.setAttribute('aria-selected', String(isActive));
    }

    dialog.setAttribute('aria-labelledby', HEADING_IDS[mode]);

    const content = mode === DialogMode.Login ? loginForm.element : registerForm.element;
    crossfadeContent(body, content);
  }

  function switchMode(mode: DialogMode): void {
    if (mode === currentMode) {
      return;
    }
    setMode(mode);
    options.onModeChange?.(mode);
  }

  const tabs: readonly TabButton[] = [DialogMode.Login, DialogMode.Register].map((mode) => ({
    mode,
    button: createElement('button', {
      className: 'auth-dialog__tab',
      text: TAB_LABELS[mode],
      attributes: { type: 'button', role: 'tab', 'aria-controls': 'auth-dialog-panel' },
      onClick: () => {
        switchMode(mode);
      },
    }),
  }));

  const tabList = createElement('div', {
    className: 'auth-dialog__tabs',
    attributes: { role: 'tablist' },
    children: tabs.map((tab) => tab.button),
  });

  const loginForm = createLoginForm({
    headingId: HEADING_IDS[DialogMode.Login],
    onSwitchToRegister: () => {
      switchMode(DialogMode.Register);
    },
  });
  const registerForm = createRegisterForm({
    headingId: HEADING_IDS[DialogMode.Register],
    onSwitchToLogin: () => {
      switchMode(DialogMode.Login);
    },
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
      requestClose();
    }
  });

  dialog.addEventListener('cancel', (event) => {
    if (pendingAction !== undefined) {
      event.preventDefault();
    }
  });

  dialog.addEventListener('close', () => {
    setPending(undefined);
    resetForms();
    document.removeEventListener('keydown', handleKeydown);
    unlockBodyScroll();
    lastFocusedElement?.focus();
    options.onClose?.();
  });

  function getFocusableElements(): HTMLElement[] {
    return [...panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)];
  }

  function handleKeydown(event: KeyboardEvent): void {
    // Browsers may skip "cancel" on a repeated Escape; block it at the source.
    if (pendingAction !== undefined && event.key === 'Escape') {
      event.preventDefault();
      return;
    }

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

  function open(mode: DialogMode): void {
    if (dialog.open) {
      if (mode !== currentMode) {
        setMode(mode);
      }
      return;
    }

    lastFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    setMode(mode);
    dialog.showModal();
    lockBodyScroll();
    document.addEventListener('keydown', handleKeydown);
  }

  setMode(DialogMode.Login);

  return {
    element: dialog,
    open,
    close: (): void => {
      if (dialog.open) {
        dialog.close();
      }
    },
    getOpenMode: (): DialogMode | undefined => (dialog.open ? currentMode : undefined),
    setPending,
    destroy: (): void => {
      document.removeEventListener('keydown', handleKeydown);
      unlockBodyScroll();
    },
  };
}
