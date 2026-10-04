import { getCurrentRoute, onRouteChange } from '@/app/router';
import type { RouteName } from '@/app/routes';
import logoMarkUrl from '@/assets/icons/logo-mark.svg';
import { dispatchAuthDialogOpen } from '@/shared/lib/app-events';
import { onBurgerMenuChange, toggleBurgerMenu } from '@/shared/lib/burger-menu-state';
import { createElement } from '@/shared/lib/dom';
import type { Component } from '@/shared/types/component';
import { DialogMode } from '@/shared/types/ui';
import './header.scss';

const HOME_HREF = '#/home';
const LIBRARY_HREF = '#/library';

interface NavItemConfig {
  readonly label: string;
  readonly href: string;
  readonly route?: RouteName;
}

const NAV_ITEMS: readonly NavItemConfig[] = [
  { label: 'Home', href: HOME_HREF, route: 'home' },
  { label: 'Library', href: LIBRARY_HREF, route: 'library' },
  { label: 'Tournaments', href: HOME_HREF },
  { label: 'Community', href: HOME_HREF },
];

function createLogo(): HTMLAnchorElement {
  const badge = createElement('img', {
    className: 'header__logo-badge',
    attributes: { src: logoMarkUrl, alt: '', width: '32', height: '32' },
  });
  const text = createElement('span', { className: 'header__logo-text', text: 'MiniGames' });

  return createElement('a', {
    className: 'header__logo',
    attributes: { href: HOME_HREF },
    children: [badge, text],
  });
}

interface NavController {
  readonly element: HTMLElement;
  readonly updateActive: (route: RouteName) => void;
}

function createNav(): NavController {
  const links: { anchor: HTMLAnchorElement; route?: RouteName | undefined }[] = [];

  const list = createElement('ul', {
    className: 'header__nav-list',
    children: NAV_ITEMS.map((item) => {
      const isInitialActive = item.route === getCurrentRoute();
      const anchor = createElement('a', {
        className: isInitialActive
          ? 'header__nav-link header__nav-link--active'
          : 'header__nav-link',
        text: item.label,
        attributes: {
          href: item.href,
          ...(isInitialActive && { 'aria-current': 'page' }),
        },
      });

      links.push({ anchor, route: item.route });

      return createElement('li', { children: [anchor] });
    }),
  });

  function updateActive(currentRoute: RouteName): void {
    for (const { anchor, route } of links) {
      const isActive = route === currentRoute;
      anchor.classList.toggle('header__nav-link--active', isActive);

      if (isActive) {
        anchor.setAttribute('aria-current', 'page');
      } else if (anchor.hasAttribute('aria-current')) {
        anchor.removeAttribute('aria-current');
      }
    }
  }

  const element = createElement('nav', {
    className: 'header__nav',
    attributes: { 'aria-label': 'Primary' },
    children: [list],
  });

  return { element, updateActive };
}

function createAuthButton(
  label: string,
  mode: DialogMode,
  variant: 'outline' | 'primary',
): HTMLButtonElement {
  return createElement('button', {
    className: `header__button header__button--${variant}`,
    text: label,
    attributes: { type: 'button' },
    onClick: () => {
      dispatchAuthDialogOpen(mode);
    },
  });
}

interface BurgerButton {
  readonly element: HTMLButtonElement;
  readonly unsubscribe: () => void;
}

function createBurgerButton(): BurgerButton {
  const lines = [0, 1, 2].map(() => createElement('span', { className: 'header__burger-line' }));

  const button = createElement('button', {
    className: 'header__burger',
    attributes: {
      type: 'button',
      'aria-label': 'Open menu',
      'aria-expanded': 'false',
    },
    children: lines,
    onClick: () => {
      toggleBurgerMenu();
    },
  });

  const unsubscribe = onBurgerMenuChange((isOpen) => {
    button.setAttribute('aria-expanded', String(isOpen));
    button.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });

  return { element: button, unsubscribe };
}

export function createHeader(): Component {
  const nav = createNav();
  const burgerButton = createBurgerButton();
  const actions = createElement('div', {
    className: 'header__actions',
    children: [
      createAuthButton('Log In', DialogMode.Login, 'outline'),
      createAuthButton('Sign Up', DialogMode.Register, 'primary'),
      burgerButton.element,
    ],
  });

  const inner = createElement('div', {
    className: 'header__inner',
    children: [createLogo(), nav.element, actions],
  });

  const unsubscribeRoute = onRouteChange((state) => {
    nav.updateActive(state.name);
  });

  const element = createElement('header', { className: 'header', children: [inner] });

  return {
    element,
    destroy: (): void => {
      burgerButton.unsubscribe();
      unsubscribeRoute();
    },
  };
}
