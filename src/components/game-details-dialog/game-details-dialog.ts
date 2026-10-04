import { tukoniComments } from '@/data/comments-tukoni';
import { fetchGameDetails } from '@/shared/api/games-api';
import { ApiError, isAbortError } from '@/shared/api/http';
import { onGameDetailsOpen } from '@/shared/lib/app-events';
import { createElement } from '@/shared/lib/dom';
import type { Component } from '@/shared/types/component';
import type { GameDetails } from '@/shared/types/game';
import { createEmptyState, createErrorBanner } from '@/shared/ui/feedback-state/feedback-state';
import { createCloseIcon } from '@/shared/ui/icon/icon';
import { createSkeleton, setBusy } from '@/shared/ui/skeleton/skeleton';
import { showSnackbar } from '@/shared/ui/snackbar/snackbar';
import { createGameDetailsComments } from './game-details-comments';
import { createGameDetailsHero } from './game-details-hero';
import { createGameDetailsInfo } from './game-details-info';
import { createGameDetailsRecords } from './game-details-records';
import './game-details-dialog.scss';

const NOT_FOUND_STATUS = 404;

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

function createBodySkeleton(): HTMLElement {
  const text = (modifier: string): HTMLElement =>
    createSkeleton({ shape: 'text', className: `game-details-dialog__skeleton-${modifier}` });

  return createElement('div', {
    className: 'game-details-dialog__skeleton',
    children: [
      text('title'),
      text('line'),
      text('line'),
      text('line-short'),
      createSkeleton({ className: 'game-details-dialog__skeleton-specs' }),
      createSkeleton({ className: 'game-details-dialog__skeleton-actions' }),
      createSkeleton({ className: 'game-details-dialog__skeleton-records' }),
    ],
  });
}

export interface GameDetailsDialogComponent extends Component {
  readonly open: (slug?: string) => void;
  readonly close: () => void;
}

export function createGameDetailsDialog(): GameDetailsDialogComponent {
  let lastFocusedElement: HTMLElement | undefined;
  let abortController: AbortController | undefined;

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

  const detailsSections: readonly HTMLElement[] = [info.element, records.element, comments.element];

  function showLoading(): void {
    hero.showLoading();
    body.replaceChildren(createBodySkeleton());
    setBusy(panel, true);
  }

  function showDetails(details: GameDetails): void {
    setBusy(panel, false);
    hero.update(details);
    info.update(details);
    records.update(details.topRecords);
    body.replaceChildren(...detailsSections);
  }

  function showNotFound(slug: string | undefined): void {
    setBusy(panel, false);
    hero.clear();
    body.replaceChildren(
      createEmptyState({
        title: 'Game Not Found',
        message:
          slug === undefined
            ? 'No game was selected.'
            : `We could not find a game with the id "${slug}". It may have been removed or the link is broken.`,
      }),
    );
  }

  function showError(slug: string, message: string): void {
    setBusy(panel, false);
    hero.clear();
    body.replaceChildren(
      createErrorBanner({
        title: 'Could not load game details',
        message,
        onRetry: () => {
          void loadDetails(slug);
        },
      }),
    );
    showSnackbar({ message: 'Failed to load game details.', variant: 'error' });
  }

  async function loadDetails(slug: string | undefined): Promise<void> {
    abortController?.abort();

    if (slug === undefined || slug === '') {
      showNotFound(undefined);
      return;
    }

    const controller = new AbortController();
    abortController = controller;
    showLoading();

    try {
      showDetails(await fetchGameDetails(slug, controller.signal));
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }
      if (error instanceof ApiError && error.status === NOT_FOUND_STATUS) {
        showNotFound(slug);
        return;
      }
      showError(slug, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  const openDialog = (slug?: string): void => {
    void loadDetails(slug);

    if (dialog.open) {
      return;
    }

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
    abortController?.abort();
    document.removeEventListener('keydown', handleKeydown);
    unlockBodyScroll();
    info.resetFavorite();
    comments.reset();
    lastFocusedElement?.focus();
  });

  const unsubscribe = onGameDetailsOpen((slug) => {
    openDialog(slug);
  });

  return {
    element: dialog,
    open: openDialog,
    close: closeDialog,
    destroy: (): void => {
      abortController?.abort();
      unsubscribe();
      document.removeEventListener('keydown', handleKeydown);
      unlockBodyScroll();
    },
  };
}
