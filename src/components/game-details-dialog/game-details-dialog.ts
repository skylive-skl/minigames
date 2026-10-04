import { tukoniComments } from '@/data/comments-tukoni';
import { tukoniGameDetails } from '@/data/game-tukoni';
import { onGameDetailsOpen } from '@/shared/lib/app-events';
import { createElement } from '@/shared/lib/dom';
import type { Component } from '@/shared/types/component';
import type { GameDetails } from '@/shared/types/game';
import { createCloseIcon } from '@/shared/ui/icon/icon';
import { createGameDetailsComments } from './game-details-comments';
import { createGameDetailsHero } from './game-details-hero';
import { createGameDetailsInfo } from './game-details-info';
import { createGameDetailsRecords } from './game-details-records';
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

  const hero = createGameDetailsHero({ closeButton });
  const info = createGameDetailsInfo();
  const records = createGameDetailsRecords();
  const comments = createGameDetailsComments(tukoniComments);

  const body = createElement('div', {
    className: 'game-details-dialog__body',
    children: [info.element, records.element, comments.element],
  });

  const panel = createElement('div', {
    className: 'game-details-dialog__panel',
    children: [hero.element, body],
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

  function renderDetails(details: GameDetails): void {
    hero.update(details);
    info.update(details);
    records.update(details.topRecords);
  }

  const openDialog = (): void => {
    renderDetails(tukoniGameDetails);
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
    info.resetFavorite();
    comments.reset();
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
