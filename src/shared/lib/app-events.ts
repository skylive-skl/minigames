import { DialogMode } from '@/shared/types/ui';

export const AUTH_DIALOG_OPEN_EVENT = 'minigames:auth-dialog-open';
export const GAME_DETAILS_DIALOG_OPEN_EVENT = 'minigames:game-details-open';

export function dispatchAuthDialogOpen(mode: DialogMode): void {
  document.dispatchEvent(new CustomEvent<DialogMode>(AUTH_DIALOG_OPEN_EVENT, { detail: mode }));
}

export function onAuthDialogOpen(handler: (mode: DialogMode) => void): () => void {
  const listener = (event: Event): void => {
    const custom = event as CustomEvent<DialogMode>;
    handler(custom.detail);
  };
  document.addEventListener(AUTH_DIALOG_OPEN_EVENT, listener);
  return () => {
    document.removeEventListener(AUTH_DIALOG_OPEN_EVENT, listener);
  };
}

export function dispatchGameDetailsOpen(slug?: string): void {
  document.dispatchEvent(
    new CustomEvent<string | undefined>(GAME_DETAILS_DIALOG_OPEN_EVENT, { detail: slug }),
  );
}

export function onGameDetailsOpen(handler: (slug?: string) => void): () => void {
  const listener = (event: Event): void => {
    const custom = event as CustomEvent<string | undefined>;
    handler(custom.detail);
  };
  document.addEventListener(GAME_DETAILS_DIALOG_OPEN_EVENT, listener);
  return () => {
    document.removeEventListener(GAME_DETAILS_DIALOG_OPEN_EVENT, listener);
  };
}
