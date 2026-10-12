import { createAuthDialog, isDialogMode } from '@/components/auth-dialog/auth-dialog';
import { createBurgerMenu } from '@/components/burger-menu/burger-menu';
import { createGameDetailsDialog } from '@/components/game-details-dialog/game-details-dialog';
import { createHeader } from '@/components/header/header';
import { ensureActiveSession, initSession, startSession } from '@/shared/auth/session-store';
import { onAuthDialogOpen, onGameDetailsOpen } from '@/shared/lib/app-events';
import { createElement } from '@/shared/lib/dom';
import { showSnackbar } from '@/shared/ui/snackbar/snackbar';
import {
  AUTH_QUERY_KEY,
  closeDialogInUrl,
  GAME_QUERY_KEY,
  openDialogInUrl,
  replaceDialogInUrl,
} from './dialog-history';
import {
  createRouter,
  onBeforeRouteChange,
  onRouteChange,
  updateQuery,
  type RouteState,
} from './router';

export interface App {
  readonly element: HTMLElement;
  readonly start: () => void;
}

export function createApp(): App {
  const header = createHeader();
  const burgerMenu = createBurgerMenu();
  const authDialog = createAuthDialog({
    onClose: () => {
      closeDialogInUrl(AUTH_QUERY_KEY);
    },
    onModeChange: (mode) => {
      replaceDialogInUrl(AUTH_QUERY_KEY, mode);
    },
    onAuthenticated: (profile) => {
      startSession(profile);
      showSnackbar({
        message: `Welcome, ${profile.displayName === '' ? profile.email : profile.displayName}!`,
        variant: 'success',
      });
    },
  });
  const gameDetailsDialog = createGameDetailsDialog({
    onClose: () => {
      closeDialogInUrl(GAME_QUERY_KEY);
    },
  });
  const outlet = createElement('main', { className: 'app-outlet' });
  const element = createElement('div', {
    attributes: { id: 'app' },
    children: [
      header.element,
      outlet,
      burgerMenu.element,
      authDialog.element,
      gameDetailsDialog.element,
    ],
  });

  onGameDetailsOpen((slug) => {
    if (slug !== undefined) {
      openDialogInUrl(GAME_QUERY_KEY, slug);
    }
  });

  function syncGameDetailsDialog(state: RouteState): void {
    const slug = state.params.get(GAME_QUERY_KEY);

    if (slug === null) {
      gameDetailsDialog.close();
    } else if (gameDetailsDialog.getOpenSlug() !== slug) {
      gameDetailsDialog.open(slug);
    }
  }

  onAuthDialogOpen((mode) => {
    openDialogInUrl(AUTH_QUERY_KEY, mode);
  });

  function syncAuthDialog(state: RouteState): void {
    const mode = state.params.get(AUTH_QUERY_KEY);

    if (mode === null) {
      authDialog.close();
    } else if (isDialogMode(mode)) {
      authDialog.open(mode);
    } else {
      updateQuery({ [AUTH_QUERY_KEY]: undefined }, { replace: true });
    }
  }

  onRouteChange((state) => {
    syncGameDetailsDialog(state);
    syncAuthDialog(state);
  });

  return {
    element,
    start: (): void => {
      initSession();
      onBeforeRouteChange(() => {
        ensureActiveSession();
      });
      createRouter(outlet).start();
    },
  };
}
