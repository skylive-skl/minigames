import { showSnackbar } from '@/shared/ui/snackbar/snackbar';
import {
  createSessionRecord,
  getSessionRemainingMs,
  isSessionExpired,
  parseSessionRecord,
  readSessionRecord,
  removeSessionRecord,
  writeSessionRecord,
  type AppSession,
} from './app-session';
import { signOutUser, type AuthProfile } from './auth-service';

export type SessionListener = (session: AppSession | undefined) => void;

const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please log in again.';
const SIGN_OUT_FAILED_MESSAGE = 'Could not sign out of your account. You are in guest mode.';
const LOGGED_OUT_MESSAGE = 'You have logged out.';

const state: {
  session: AppSession | undefined;
  expiryTimerId: ReturnType<typeof setTimeout> | undefined;
  isWatchingActivity: boolean;
} = {
  session: undefined,
  expiryTimerId: undefined,
  isWatchingActivity: false,
};

const listeners = new Set<SessionListener>();

function notify(): void {
  for (const listener of listeners) {
    listener(state.session);
  }
}

function clearExpiryTimer(): void {
  if (state.expiryTimerId === undefined) {
    return;
  }
  clearTimeout(state.expiryTimerId);
  state.expiryTimerId = undefined;
}

function scheduleExpiry(session: AppSession): void {
  clearExpiryTimer();
  const delay = Math.max(0, getSessionRemainingMs(session, Date.now()));
  state.expiryTimerId = setTimeout(expireSession, delay);
}

function activate(session: AppSession): void {
  state.session = session;
  scheduleExpiry(session);
  notify();
}

function clearSession(): void {
  clearExpiryTimer();
  removeSessionRecord();

  const wasActive = state.session !== undefined;
  state.session = undefined;

  if (wasActive) {
    notify();
  }
}

async function signOutOfFirebase(successMessage?: string): Promise<void> {
  try {
    await signOutUser();
  } catch {
    showSnackbar({ message: SIGN_OUT_FAILED_MESSAGE, variant: 'error' });
    return;
  }

  if (successMessage !== undefined) {
    showSnackbar({ message: successMessage, variant: 'success' });
  }
}

function handleVisibilityChange(): void {
  if (document.visibilityState === 'visible') {
    ensureActiveSession();
  }
}

function handleWindowFocus(): void {
  ensureActiveSession();
}

function watchActivity(): void {
  if (state.isWatchingActivity) {
    return;
  }
  state.isWatchingActivity = true;
  document.addEventListener('visibilitychange', handleVisibilityChange);
  globalThis.addEventListener('focus', handleWindowFocus);
}

export function getActiveSession(): AppSession | undefined {
  return state.session;
}

export function ensureActiveSession(): AppSession | undefined {
  const { session } = state;

  if (session !== undefined && isSessionExpired(session, Date.now())) {
    expireSession();
    return undefined;
  }

  return session;
}

export function expireSession(): void {
  if (state.session === undefined) {
    return;
  }

  clearSession();
  showSnackbar({ message: SESSION_EXPIRED_MESSAGE, variant: 'info' });
  void signOutOfFirebase();
}

export function initSession(): AppSession | undefined {
  watchActivity();

  const raw = readSessionRecord();

  if (raw === undefined) {
    return undefined;
  }

  const session = parseSessionRecord(raw);

  if (session === undefined) {
    removeSessionRecord();
    void signOutOfFirebase();
    return undefined;
  }

  if (isSessionExpired(session, Date.now())) {
    state.session = session;
    expireSession();
    return undefined;
  }

  activate(session);
  return session;
}

export function startSession(profile: AuthProfile): AppSession {
  const session = createSessionRecord(profile, Date.now());
  writeSessionRecord(session);
  activate(session);
  return session;
}

export function logout(): Promise<void> {
  clearSession();
  return signOutOfFirebase(LOGGED_OUT_MESSAGE);
}

export function onSessionChange(listener: SessionListener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
