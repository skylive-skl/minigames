import { createAuthDialog } from '@/components/auth-dialog/auth-dialog';
import { createBurgerMenu } from '@/components/burger-menu/burger-menu';
import { createGameDetailsDialog } from '@/components/game-details-dialog/game-details-dialog';
import { createHeader } from '@/components/header/header';
import { createElement } from '@/shared/lib/dom';
import { createRouter } from './router';

export function createApp(): HTMLElement {
  const header = createHeader();
  const burgerMenu = createBurgerMenu();
  const authDialog = createAuthDialog();
  const gameDetailsDialog = createGameDetailsDialog();
  const outlet = createElement('main', { className: 'app-outlet' });
  const root = createElement('div', {
    attributes: { id: 'app' },
    children: [
      header.element,
      outlet,
      burgerMenu.element,
      authDialog.element,
      gameDetailsDialog.element,
    ],
  });

  createRouter(outlet).start();

  return root;
}
