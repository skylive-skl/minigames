import { DialogMode } from '@/shared/types/ui';

export const AUTH_DIALOG_OPEN_EVENT = 'minigames:auth-dialog-open';
export const BURGER_MENU_TOGGLE_EVENT = 'minigames:burger-menu-toggle';

export function dispatchAuthDialogOpen(mode: DialogMode): void {
  document.dispatchEvent(new CustomEvent<DialogMode>(AUTH_DIALOG_OPEN_EVENT, { detail: mode }));
}

export function dispatchBurgerMenuToggle(isOpen: boolean): void {
  document.dispatchEvent(new CustomEvent<boolean>(BURGER_MENU_TOGGLE_EVENT, { detail: isOpen }));
}
