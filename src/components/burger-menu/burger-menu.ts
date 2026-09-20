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
const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled])';

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

function createNavLinkItem(link: NavLink): HTMLLIElement {
  const className = link.isActive
    ? 'burger-menu__link burger-menu__link--active'
    : 'burger-menu__link';
  const attributes: Record<string, string> = { href: HOME_HREF };

  if (link.isActive) {
    attributes['aria-current'] = 'page';
  }

  const anchor = createElement('a', {
    className,
    text: link.label,
    attributes,
    onClick: closeMenu,
  });

  return createElement('li', { children: [anchor] });
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

  const links = createElement('ul', {
    className: 'burger-menu__links',
    children: NAV_LINKS.map((link) => createNavLinkItem(link)),
  });

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

  const unsubscribe = onBurgerMenuChange((isOpen) => {
    if (isOpen) {
      open();
    } else {
      close();
    }
  });

  if (isBurgerMenuOpen()) {
    open();
  }

  return {
    element,
    destroy: (): void => {
      unsubscribe();
      document.removeEventListener('keydown', handleKeydown);
      unlockBodyScroll();
    },
  };
}
