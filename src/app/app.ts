import { createAuthDialog } from '@/components/auth-dialog/auth-dialog';
import { createBurgerMenu } from '@/components/burger-menu/burger-menu';
import { createHeader } from '@/components/header/header';
import { createElement } from '@/shared/lib/dom';
import { createRouter } from './router';

export function createApp(): HTMLElement {
  const header = createHeader();
  const burgerMenu = createBurgerMenu();
  const authDialog = createAuthDialog();
  const outlet = createElement('main', { className: 'app-outlet' });
  const root = createElement('div', {
    attributes: { id: 'app' },
    children: [header.element, outlet, burgerMenu.element, authDialog.element],
  });

  createRouter(outlet).start();

  return root;
}
