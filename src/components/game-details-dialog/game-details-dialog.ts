import { onGameDetailsOpen } from '@/shared/lib/app-events';
import { createElement } from '@/shared/lib/dom';
import type { Component } from '@/shared/types/component';
import { createCloseIcon } from '@/shared/ui/icon/icon';
import './game-details-dialog.scss';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function lockBodyScroll(): void {
  const scrollbarWidth = globalThis.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = 'hidden';
  document.body.style.paddingRight = scrollbarWidth > 0 ? `${String(scrollbarWidth)}px` : '';
}

function unlockBodyScroll(): void {
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
}

export interface GameDetailsDialogComponent extends Component {
  readonly open: () => void;
  readonly close: () => void;
}

export function createGameDetailsDialog(): GameDetailsDialogComponent {
  let lastFocusedElement: HTMLElement | undefined;

  const closeIcon = createCloseIcon();
  closeIcon.classList.add('game-details-dialog__close-icon');

  const closeButton = createElement('button', {
    className: 'game-details-dialog__close',
    attributes: {
      type: 'button',
      'aria-label': 'Close game details',
    },
    children: [closeIcon],
    onClick: () => {
      dialog.close();
    },
  });

  const placeholder = createElement('div', {
    className: 'game-details-dialog__placeholder',
    children: [
      createElement('h2', {
        className: 'game-details-dialog__title',
        text: 'Tukoni: Forest Keepers',
      }),
    ],
  });

  const content = createElement('div', {
    className: 'game-details-dialog__content',
    children: [placeholder],
  });

  const panel = createElement('div', {
    className: 'game-details-dialog__panel',
    children: [closeButton, content],
  });

  const dialog = createElement('dialog', {
    className: 'game-details-dialog',
    attributes: {
      'aria-modal': 'true',
      'aria-label': 'Game details',
    },
    children: [panel],
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

  const openDialog = (): void => {
    lastFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : undefined;

    dialog.showModal();
    lockBodyScroll();
    document.addEventListener('keydown', handleKeydown);
    closeButton.focus();
  };

  const closeDialog = (): void => {
    if (dialog.open) {
      dialog.close();
    }
  };

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  dialog.addEventListener('close', () => {
    document.removeEventListener('keydown', handleKeydown);
    unlockBodyScroll();
    lastFocusedElement?.focus();
  });

  const unsubscribe = onGameDetailsOpen(() => {
    openDialog();
  });

  return {
    element: dialog,
    open: openDialog,
    close: closeDialog,
    destroy: (): void => {
      unsubscribe();
      document.removeEventListener('keydown', handleKeydown);
      unlockBodyScroll();
    },
  };
}
