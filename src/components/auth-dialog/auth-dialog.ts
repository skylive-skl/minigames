import { AUTH_DIALOG_OPEN_EVENT } from '@/shared/lib/app-events';
import { createElement } from '@/shared/lib/dom';
import { createCloseIcon } from '@/shared/ui/icon/icon';
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
