import { fetchLatestComments } from '@/shared/api/comments-api';
import { fetchGameDetails, toggleFavorite } from '@/shared/api/games-api';
import { ApiError, isAbortError, NETWORK_ERROR_STATUS } from '@/shared/api/http';
import { requireSession } from '@/shared/auth/protected-action';
import { getActiveSession, onSessionChange } from '@/shared/auth/session-store';
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

const FAVORITE_GUEST_WARNING = 'Log in to add games to your favorites.';
const FAVORITE_UNKNOWN_MESSAGE =
  "We couldn't confirm the favorite change. Reopen the game to see its current state.";

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

export interface GameDetailsDialogOptions {
  // Fires on every close (button, backdrop, Escape, programmatic).
  readonly onClose?: () => void;
}

export interface GameDetailsDialogComponent extends Component {
  readonly open: (slug?: string) => void;
  readonly close: () => void;
  // Closes without onClose, so the game stays in the URL: used while Auth
  // temporarily replaces Game Details.
  readonly hide: () => void;
  readonly getOpenSlug: () => string | undefined;
}

export function createGameDetailsDialog(
  options: GameDetailsDialogOptions = {},
): GameDetailsDialogComponent {
  let lastFocusedElement: HTMLElement | undefined;
  let openSlug: string | undefined;
  let abortController: AbortController | undefined;
  let commentsAbortController: AbortController | undefined;

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
  const info = createGameDetailsInfo({
    onFavoriteClick: () => {
      void handleFavoriteClick();
    },
  });
  const records = createGameDetailsRecords();
  const comments = createGameDetailsComments();

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

  async function loadComments(slug: string): Promise<void> {
    commentsAbortController?.abort();
    const controller = new AbortController();
    commentsAbortController = controller;

    comments.showLoading();

    try {
      const response = await fetchLatestComments(slug, {
        userEmail: getActiveSession()?.email,
        signal: controller.signal,
      });
      comments.showComments(response.data, response.meta.totalComments);
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }
      comments.showError(error instanceof Error ? error.message : 'Unknown error', () => {
        void loadComments(slug);
      });
      showSnackbar({ message: 'Failed to load comments.', variant: 'error' });
    }
  }

  let isFavoritePending = false;

  // Server-driven toggle: one request at a time, state taken only from the
  // response, never replayed when the outcome is unknown.
  async function handleFavoriteClick(): Promise<void> {
    const slug = openSlug;

    if (isFavoritePending || slug === undefined) {
      return;
    }

    const session = requireSession(FAVORITE_GUEST_WARNING);

    if (session === undefined) {
      return;
    }

    isFavoritePending = true;
    info.setFavoritePending(true);

    try {
      const result = await toggleFavorite(slug, session.email);
      // Ignore answers for a game that is no longer shown.
      if (openSlug === slug) {
        info.setFavorite(result.isFavorited, result.likesCount);
        showSnackbar({
          message: result.isFavorited ? 'Added to favorites.' : 'Removed from favorites.',
          variant: 'success',
        });
      }
    } catch (error) {
      const isOutcomeUnknown = error instanceof ApiError && error.status === NETWORK_ERROR_STATUS;
      showSnackbar(
        isOutcomeUnknown
          ? { message: FAVORITE_UNKNOWN_MESSAGE, variant: 'warning' }
          : {
              message:
                `Could not update favorites. ${error instanceof Error ? error.message : ''}`.trim(),
              variant: 'error',
            },
      );
    } finally {
      isFavoritePending = false;
      info.setFavoritePending(false);
    }
  }

  function abortRequests(): void {
    abortController?.abort();
    commentsAbortController?.abort();
  }

  async function loadDetails(slug: string | undefined): Promise<void> {
    abortRequests();

    if (slug === undefined || slug === '') {
      showNotFound(undefined);
      return;
    }

    const controller = new AbortController();
    abortController = controller;
    showLoading();
    // Comments load in parallel and keep their own loading/error state.
    void loadComments(slug);

    try {
      showDetails(
        await fetchGameDetails(slug, {
          userEmail: getActiveSession()?.email,
          signal: controller.signal,
        }),
      );
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }
      commentsAbortController?.abort();
      if (error instanceof ApiError && error.status === NOT_FOUND_STATUS) {
        showNotFound(slug);
        return;
      }
      showError(slug, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  const openDialog = (slug?: string): void => {
    openSlug = slug;
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

  // Sign-in, logout or expiry while the dialog is open: reload so favorite
  // and like states match the current user (or guest).
  const unsubscribeSession = onSessionChange(() => {
    if (openSlug !== undefined && dialog.open) {
      void loadDetails(openSlug);
    }
  });

  let isHiding = false;

  const hideDialog = (): void => {
    if (!dialog.open) {
      return;
    }
    isHiding = true;
    dialog.close();
    isHiding = false;
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
    openSlug = undefined;
    abortRequests();
    document.removeEventListener('keydown', handleKeydown);
    unlockBodyScroll();
    comments.reset();
    lastFocusedElement?.focus();
    if (!isHiding) {
      options.onClose?.();
    }
  });

  return {
    element: dialog,
    open: openDialog,
    close: closeDialog,
    hide: hideDialog,
    getOpenSlug: (): string | undefined => (dialog.open ? openSlug : undefined),
    destroy: (): void => {
      unsubscribeSession();
      abortRequests();
      document.removeEventListener('keydown', handleKeydown);
      unlockBodyScroll();
    },
  };
}
