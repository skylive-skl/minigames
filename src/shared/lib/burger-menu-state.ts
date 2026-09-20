type BurgerMenuListener = (isOpen: boolean) => void;

const state = { isOpen: false };
const listeners = new Set<BurgerMenuListener>();

export function isBurgerMenuOpen(): boolean {
  return state.isOpen;
}

export function setBurgerMenuOpen(shouldBeOpen: boolean): void {
  if (shouldBeOpen === state.isOpen) {
    return;
  }

  state.isOpen = shouldBeOpen;

  for (const listener of listeners) {
    listener(state.isOpen);
  }
}

export function toggleBurgerMenu(): void {
  setBurgerMenuOpen(!state.isOpen);
}

export function onBurgerMenuChange(listener: BurgerMenuListener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
