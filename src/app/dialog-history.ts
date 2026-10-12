import { getRouteState, updateQuery } from './router';

export const GAME_QUERY_KEY = 'game';
export const AUTH_QUERY_KEY = 'auth';

const DIALOG_HISTORY_STATE = { minigamesDialog: true } as const;

function isDialogHistoryEntry(): boolean {
  const state: unknown = globalThis.history.state;
  return typeof state === 'object' && state !== null && 'minigamesDialog' in state;
}

export function openDialogInUrl(key: string, value: string): void {
  updateQuery({ [key]: value }, { state: DIALOG_HISTORY_STATE });
}

export function replaceDialogInUrl(key: string, value: string): void {
  const state: unknown = globalThis.history.state;
  updateQuery({ [key]: value }, { replace: true, state });
}

export function closeDialogInUrl(key: string): void {
  if (!getRouteState().params.has(key)) {
    return;
  }

  if (isDialogHistoryEntry()) {
    globalThis.history.back();
  } else {
    updateQuery({ [key]: undefined }, { replace: true });
  }
}
