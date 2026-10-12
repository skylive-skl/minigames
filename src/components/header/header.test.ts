import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBurgerMenu } from '@/components/burger-menu/burger-menu';
import { signOutUser } from '@/shared/auth/auth-service';
import { getActiveSession, logout, startSession } from '@/shared/auth/session-store';
import { AUTH_DIALOG_OPEN_EVENT } from '@/shared/lib/app-events';
import { isBurgerMenuOpen, setBurgerMenuOpen } from '@/shared/lib/burger-menu-state';
import { createHeader } from './header';

vi.mock('@/shared/auth/auth-service', () => ({ signOutUser: vi.fn(() => Promise.resolve()) }));
vi.mock('@/shared/ui/snackbar/snackbar', () => ({ showSnackbar: vi.fn() }));

const profile = { displayName: 'John Doe', email: 'john@mail.com' };

function buttonLabels(root: Element, selector: string): string[] {
  return [...root.querySelectorAll<HTMLButtonElement>(selector)].map(
    (button) => button.textContent,
  );
}

function findButton(root: Element, label: string): HTMLButtonElement {
  const button = [...root.querySelectorAll('button')].find(
    (candidate) => candidate.textContent === label,
  );
  if (button === undefined) {
    throw new Error(`Button "${label}" is missing`);
  }
  return button;
}

afterEach(async () => {
  await logout();
  setBurgerMenuOpen(false);
});

describe('header auth state', () => {
  it('shows Log In and Sign Up for guests', () => {
    const header = createHeader();

    expect(buttonLabels(header.element, '.header__button')).toEqual(['Log In', 'Sign Up']);
    expect(header.element.querySelector('.user-profile')).toBeNull();
  });

  it('asks to open the auth dialog from the guest buttons', () => {
    const header = createHeader();
    const listener = vi.fn();
    document.addEventListener(AUTH_DIALOG_OPEN_EVENT, listener);

    findButton(header.element, 'Sign Up').click();

    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: 'register' }));
    document.removeEventListener(AUTH_DIALOG_OPEN_EVENT, listener);
  });

  it('switches to the profile and Log Out once a session starts', () => {
    const header = createHeader();

    startSession(profile);

    expect(buttonLabels(header.element, '.header__button')).toEqual(['Log Out']);
    expect(header.element.querySelector('.user-profile__name')?.textContent).toBe('John Doe');
    expect(header.element.querySelector('.user-profile__avatar')?.textContent).toBe('JD');
  });

  it('renders an already active session on creation', () => {
    startSession(profile);

    const header = createHeader();

    expect(buttonLabels(header.element, '.header__button')).toEqual(['Log Out']);
  });

  it('logs out and restores the guest controls', async () => {
    const header = createHeader();
    startSession(profile);

    findButton(header.element, 'Log Out').click();

    expect(getActiveSession()).toBeUndefined();
    expect(buttonLabels(header.element, '.header__button')).toEqual(['Log In', 'Sign Up']);
    await vi.waitFor(() => {
      expect(signOutUser).toHaveBeenCalled();
    });
  });

  it('stops reacting to the session after destroy', () => {
    const header = createHeader();
    header.destroy?.();

    startSession(profile);

    expect(buttonLabels(header.element, '.header__button')).toEqual(['Log In', 'Sign Up']);
  });
});

describe('burger menu auth state', () => {
  it('shows the profile and Log Out in the mobile menu', () => {
    const menu = createBurgerMenu();

    expect(buttonLabels(menu.element, '.burger-menu__button')).toEqual(['Log In', 'Sign Up']);

    startSession({ ...profile, avatarUrl: 'https://example.com/john.png' });

    expect(buttonLabels(menu.element, '.burger-menu__button')).toEqual(['Log Out']);
    expect(menu.element.querySelector('.user-profile__name')?.textContent).toBe('John Doe');
    expect(menu.element.querySelector('.user-profile__photo')).not.toBeNull();
  });

  it('closes the menu and logs out from the mobile Log Out button', () => {
    const menu = createBurgerMenu();
    document.body.append(menu.element);
    startSession(profile);
    setBurgerMenuOpen(true);

    findButton(menu.element, 'Log Out').click();

    expect(isBurgerMenuOpen()).toBe(false);
    expect(getActiveSession()).toBeUndefined();
    expect(buttonLabels(menu.element, '.burger-menu__button')).toEqual(['Log In', 'Sign Up']);
    menu.destroy?.();
  });
});
