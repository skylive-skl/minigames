import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isBurgerMenuOpen,
  onBurgerMenuChange,
  setBurgerMenuOpen,
  toggleBurgerMenu,
} from './burger-menu-state';

describe('burger menu state', () => {
  afterEach(() => {
    setBurgerMenuOpen(false);
  });

  it('toggles the open flag and notifies listeners', () => {
    const listener = vi.fn();
    const unsubscribe = onBurgerMenuChange(listener);

    toggleBurgerMenu();
    expect(isBurgerMenuOpen()).toBe(true);
    expect(listener).toHaveBeenLastCalledWith(true);

    toggleBurgerMenu();
    expect(isBurgerMenuOpen()).toBe(false);
    expect(listener).toHaveBeenLastCalledWith(false);

    unsubscribe();
  });

  it('does not notify when the state does not change', () => {
    const listener = vi.fn();
    const unsubscribe = onBurgerMenuChange(listener);

    setBurgerMenuOpen(false);

    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('stops notifying after unsubscribe', () => {
    const listener = vi.fn();
    onBurgerMenuChange(listener)();

    setBurgerMenuOpen(true);

    expect(listener).not.toHaveBeenCalled();
  });
});
