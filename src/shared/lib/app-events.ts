import { DialogMode } from '@/shared/types/ui';

export const AUTH_DIALOG_OPEN_EVENT = 'minigames:auth-dialog-open';

export function dispatchAuthDialogOpen(mode: DialogMode): void {
  document.dispatchEvent(new CustomEvent<DialogMode>(AUTH_DIALOG_OPEN_EVENT, { detail: mode }));
}
