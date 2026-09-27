import { getCurrentRoute, onRouteChange } from '@/app/router';
import type { RouteName } from '@/app/routes';
import logoMarkUrl from '@/assets/icons/logo-mark.svg';
import { dispatchAuthDialogOpen } from '@/shared/lib/app-events';
import {
  isBurgerMenuOpen,
  onBurgerMenuChange,
  setBurgerMenuOpen,
} from '@/shared/lib/burger-menu-state';
import { createElement } from '@/shared/lib/dom';
import type { Component } from '@/shared/types/component';
import { DialogMode } from '@/shared/types/ui';
import './burger-menu.scss';

const HOME_HREF = '#/home';
const LIBRARY_HREF = '#/library';
const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled])';

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

function closeMenu(): void {
  setBurgerMenuOpen(false);
}

function lockBodyScroll(): void {
  const scrollbarWidth = globalThis.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = 'hidden';
  document.body.style.paddingRight = scrollbarWidth > 0 ? `${String(scrollbarWidth)}px` : '';
}

function unlockBodyScroll(): void {
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)];
}

function createCloseIcon(): HTMLElement {
  return createElement('span', {
    className: 'burger-menu__close-icon',
    children: [
      createElement('span', { className: 'burger-menu__close-bar burger-menu__close-bar--a' }),
      createElement('span', { className: 'burger-menu__close-bar burger-menu__close-bar--b' }),
    ],
  });
}

export function createBurgerMenu(): Component {
  let lastFocusedElement: HTMLElement | undefined;

  const closeButton = createElement('button', {
    className: 'burger-menu__close',
    attributes: { type: 'button', 'aria-label': 'Close menu' },
    children: [createCloseIcon()],
    onClick: closeMenu,
  });

  const logo = createElement('a', {
    className: 'burger-menu__logo',
    attributes: { href: HOME_HREF },
    children: [
      createElement('img', {
        className: 'burger-menu__logo-badge',
        attributes: { src: logoMarkUrl, alt: '', width: '32', height: '32' },
      }),
      createElement('span', { className: 'burger-menu__logo-text', text: 'MiniGames' }),
    ],
    onClick: closeMenu,
  });

  const top = createElement('div', {
    className: 'burger-menu__top',
    children: [logo, closeButton],
  });

  const navLinks: { anchor: HTMLAnchorElement; route?: RouteName | undefined }[] = [];

  const links = createElement('ul', {
    className: 'burger-menu__links',
    children: NAV_ITEMS.map((item) => {
      const isInitialActive = item.route === getCurrentRoute();
      const anchor = createElement('a', {
        className: isInitialActive
          ? 'burger-menu__link burger-menu__link--active'
          : 'burger-menu__link',
        text: item.label,
        attributes: {
          href: item.href,
          ...(isInitialActive && { 'aria-current': 'page' }),
        },
        onClick: closeMenu,
      });

      navLinks.push({ anchor, route: item.route });

      return createElement('li', { children: [anchor] });
    }),
  });

  function updateActive(currentRoute: RouteName): void {
    for (const { anchor, route } of navLinks) {
      const isActive = route === currentRoute;
      anchor.classList.toggle('burger-menu__link--active', isActive);

      if (isActive) {
        anchor.setAttribute('aria-current', 'page');
      } else if (anchor.hasAttribute('aria-current')) {
        anchor.removeAttribute('aria-current');
      }
    }
  }

  const nav = createElement('nav', {
    className: 'burger-menu__nav',
    attributes: { 'aria-label': 'Mobile' },
    children: [links],
  });

  const loginButton = createElement('button', {
    className: 'burger-menu__button burger-menu__button--outline',
    text: 'Log In',
    attributes: { type: 'button' },
    onClick: () => {
      closeMenu();
      dispatchAuthDialogOpen(DialogMode.Login);
    },
  });

  const signUpButton = createElement('button', {
    className: 'burger-menu__button burger-menu__button--primary',
    text: 'Sign Up',
    attributes: { type: 'button' },
    onClick: () => {
      closeMenu();
      dispatchAuthDialogOpen(DialogMode.Register);
    },
  });

  const actions = createElement('div', {
    className: 'burger-menu__actions',
    children: [loginButton, signUpButton],
  });

  const panel = createElement('div', {
    className: 'burger-menu__panel',
    children: [top, nav, actions],
  });

  const element = createElement('div', {
    className: 'burger-menu',
    attributes: {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': 'Mobile navigation',
      'aria-hidden': 'true',
    },
    children: [panel],
  });

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusable = getFocusableElements(panel);

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

  function open(): void {
    lastFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    element.classList.add('burger-menu--open');
    element.setAttribute('aria-hidden', 'false');
    lockBodyScroll();
    document.addEventListener('keydown', handleKeydown);
    closeButton.focus();
  }

  function close(): void {
    element.classList.remove('burger-menu--open');
    element.setAttribute('aria-hidden', 'true');
    unlockBodyScroll();
    document.removeEventListener('keydown', handleKeydown);
    lastFocusedElement?.focus();
  }

  const unsubscribeBurger = onBurgerMenuChange((isOpen) => {
    if (isOpen) {
      open();
    } else {
      close();
    }
  });

  const unsubscribeRoute = onRouteChange((route) => {
    updateActive(route);
  });

  if (isBurgerMenuOpen()) {
    open();
  }

  return {
    element,
    destroy: (): void => {
      unsubscribeBurger();
      unsubscribeRoute();
      document.removeEventListener('keydown', handleKeydown);
      unlockBodyScroll();
    },
  };
}
