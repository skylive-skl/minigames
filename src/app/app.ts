import { createAuthDialog } from '@/components/auth-dialog/auth-dialog';
import { createBurgerMenu } from '@/components/burger-menu/burger-menu';
import { createGameDetailsDialog } from '@/components/game-details-dialog/game-details-dialog';
import { createHeader } from '@/components/header/header';
import { onGameDetailsOpen } from '@/shared/lib/app-events';
import { createElement } from '@/shared/lib/dom';
import { closeDialogInUrl, GAME_QUERY_KEY, openDialogInUrl } from './dialog-history';
import { createRouter, onRouteChange, type RouteState } from './router';

export interface App {
  readonly element: HTMLElement;
  // Must run after `element` is in the document: deep links open <dialog>s.
  readonly start: () => void;
}

export function createApp(): App {
  const header = createHeader();
  const burgerMenu = createBurgerMenu();
  const authDialog = createAuthDialog();
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

  // Cards only announce the intent; the URL change below opens the dialog.
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

  onRouteChange(syncGameDetailsDialog);

  return {
    element,
    start: (): void => {
      createRouter(outlet).start();
    },
  };
}
