import type { AuthProfile } from './auth-service';

// One namespaced key so logout/expiry never touch unrelated localStorage data.
export const APP_SESSION_KEY = 'minigames:skylive-minigames:app-session';

// Fixed lifetime counted from sign-in; reloads and activity do not extend it.
export const SESSION_LIFETIME_MS = 5 * 60 * 1000;

// Only what the UI and API need: no passwords or Firebase tokens.
export interface AppSession {
  readonly displayName: string;
  readonly email: string;
  readonly authenticatedAt: number;
  readonly avatarUrl?: string;
}

export function createSessionRecord(profile: AuthProfile, now: number): AppSession {
  const session = {
    displayName: profile.displayName,
    email: profile.email,
    authenticatedAt: now,
  };
  return profile.avatarUrl ? { ...session, avatarUrl: profile.avatarUrl } : session;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

// Returns undefined for anything that is not a well-formed session record.
export function parseSessionRecord(raw: string | undefined): AppSession | undefined {
  if (raw === undefined) {
    return undefined;
  }

  const value = parseJson(raw);

  if (!isRecord(value)) {
    return undefined;
  }

  const { displayName, email, authenticatedAt, avatarUrl } = value;

  if (
    typeof displayName !== 'string' ||
    typeof email !== 'string' ||
    email === '' ||
    typeof authenticatedAt !== 'number' ||
    !Number.isFinite(authenticatedAt) ||
    (avatarUrl !== undefined && typeof avatarUrl !== 'string')
  ) {
    return undefined;
  }

  const session = { displayName, email, authenticatedAt };
  return avatarUrl ? { ...session, avatarUrl } : session;
}

export function getSessionRemainingMs(session: AppSession, now: number): number {
  return session.authenticatedAt + SESSION_LIFETIME_MS - now;
}

// A timestamp from the future can only come from an edited record; treating
// it as expired keeps the lifetime from being extended by hand.
export function isSessionExpired(session: AppSession, now: number): boolean {
  return session.authenticatedAt > now || getSessionRemainingMs(session, now) <= 0;
}

// Storage access can throw (privacy mode, quota); the app then runs as a guest.
export function readSessionRecord(): string | undefined {
  try {
    return localStorage.getItem(APP_SESSION_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

export function writeSessionRecord(session: AppSession): void {
  try {
    localStorage.setItem(APP_SESSION_KEY, JSON.stringify(session));
  } catch {
    // The session still works in memory until the page is reloaded.
  }
}

export function removeSessionRecord(): void {
  try {
    localStorage.removeItem(APP_SESSION_KEY);
  } catch {
    // Nothing persisted, nothing to remove.
  }
}
