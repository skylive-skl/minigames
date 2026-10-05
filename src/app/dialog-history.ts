import { getRouteState, updateQuery } from './router';

export const GAME_QUERY_KEY = 'game';

// Marks history entries pushed when a dialog was opened inside the app, so
// closing it can step back instead of stacking a new "closed" entry.
const DIALOG_HISTORY_STATE = { minigamesDialog: true } as const;

function isDialogHistoryEntry(): boolean {
  const state: unknown = globalThis.history.state;
  return typeof state === 'object' && state !== null && 'minigamesDialog' in state;
}

export function openDialogInUrl(key: string, value: string): void {
  updateQuery({ [key]: value }, { state: DIALOG_HISTORY_STATE });
}

export function closeDialogInUrl(key: string): void {
  if (!getRouteState().params.has(key)) {
    return;
  }

  if (isDialogHistoryEntry()) {
    globalThis.history.back();
  } else {
    // Deep-linked dialog: there is no in-app entry to go back to.
    updateQuery({ [key]: undefined }, { replace: true });
  }
}
