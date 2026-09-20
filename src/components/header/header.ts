import logoMarkUrl from '@/assets/icons/logo-mark.svg';
import { createElement } from '@/shared/lib/dom';
import { dispatchAuthDialogOpen } from '@/shared/lib/app-events';
import { onBurgerMenuChange, toggleBurgerMenu } from '@/shared/lib/burger-menu-state';
import type { Component } from '@/shared/types/component';
import { DialogMode } from '@/shared/types/ui';
import './header.scss';

const HOME_HREF = '#/home';

interface NavLink {
  readonly label: string;
  readonly isActive: boolean;
}

const NAV_LINKS: readonly NavLink[] = [
  { label: 'Home', isActive: true },
  { label: 'Library', isActive: false },
  { label: 'Tournaments', isActive: false },
  { label: 'Community', isActive: false },
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

function createNavLinkItem(link: NavLink): HTMLLIElement {
  const className = link.isActive
    ? 'header__nav-link header__nav-link--active'
    : 'header__nav-link';
  const attributes: Record<string, string> = { href: HOME_HREF };

  if (link.isActive) {
    attributes['aria-current'] = 'page';
  }

  const anchor = createElement('a', { className, text: link.label, attributes });

  return createElement('li', { children: [anchor] });
}

function createNav(): HTMLElement {
  const list = createElement('ul', {
    className: 'header__nav-list',
    children: NAV_LINKS.map((link) => createNavLinkItem(link)),
  });

  return createElement('nav', {
    className: 'header__nav',
    attributes: { 'aria-label': 'Primary' },
    children: [list],
  });
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
    children: [createLogo(), createNav(), actions],
  });

  const element = createElement('header', { className: 'header', children: [inner] });

  return { element, destroy: burgerButton.unsubscribe };
}
