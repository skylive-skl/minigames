import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_SESSION_KEY, SESSION_LIFETIME_MS, type AppSession } from './app-session';

const mocks = vi.hoisted(() => ({
  signOutUser: vi.fn<() => Promise<void>>(),
  showSnackbar: vi.fn(),
}));

vi.mock('./auth-service', () => ({ signOutUser: mocks.signOutUser }));
vi.mock('@/shared/ui/snackbar/snackbar', () => ({ showSnackbar: mocks.showSnackbar }));

type SessionStore = typeof import('./session-store');

const NOW = new Date('2026-10-12T12:00:00Z').getTime();
const profile = { displayName: 'Alex', email: 'alex@mail.com' };

async function loadStore(): Promise<SessionStore> {
  vi.resetModules();
  return import('./session-store');
}

function storeRecord(record: unknown): void {
  localStorage.setItem(APP_SESSION_KEY, JSON.stringify(record));
}

function snackbarMessages(): string[] {
  return mocks.showSnackbar.mock.calls.map(([options]) => (options as { message: string }).message);
}

describe('session store', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    vi.setSystemTime(NOW);
    mocks.signOutUser.mockReset().mockResolvedValue();
    mocks.showSnackbar.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('startSession', () => {
    it('persists the profile with the sign-in time and notifies listeners', async () => {
      const store = await loadStore();
      const listener = vi.fn();
      store.onSessionChange(listener);

      const session = store.startSession(profile);

      const expected: AppSession = { ...profile, authenticatedAt: NOW };
      expect(session).toEqual(expected);
      expect(JSON.parse(localStorage.getItem(APP_SESSION_KEY) ?? '')).toEqual(expected);
      expect(store.getActiveSession()).toEqual(expected);
      expect(listener).toHaveBeenCalledWith(expected);
    });

    it('expires automatically five minutes after sign-in', async () => {
      const store = await loadStore();
      const listener = vi.fn();
      store.startSession(profile);
      store.onSessionChange(listener);

      vi.advanceTimersByTime(SESSION_LIFETIME_MS - 1);
      expect(store.getActiveSession()).toBeDefined();

      vi.advanceTimersByTime(1);

      expect(store.getActiveSession()).toBeUndefined();
      expect(localStorage.getItem(APP_SESSION_KEY)).toBeNull();
      expect(listener).toHaveBeenCalledWith(undefined);
      expect(mocks.signOutUser).toHaveBeenCalledOnce();
      expect(snackbarMessages()).toEqual(['Your session has expired. Please log in again.']);
    });
  });

  describe('initSession', () => {
    it('starts as guest when nothing is stored', async () => {
      const store = await loadStore();

      expect(store.initSession()).toBeUndefined();
      expect(mocks.signOutUser).not.toHaveBeenCalled();
    });

    it('restores a valid session without extending its lifetime', async () => {
      const authenticatedAt = NOW - 2 * 60 * 1000;
      storeRecord({ ...profile, authenticatedAt });
      const store = await loadStore();

      expect(store.initSession()).toEqual({ ...profile, authenticatedAt });
      expect(JSON.parse(localStorage.getItem(APP_SESSION_KEY) ?? '')).toMatchObject({
        authenticatedAt,
      });

      vi.advanceTimersByTime(3 * 60 * 1000);
      expect(store.getActiveSession()).toBeUndefined();
    });

    it('removes an invalid record, signs out of Firebase and stays guest', async () => {
      localStorage.setItem(APP_SESSION_KEY, '{broken');
      localStorage.setItem('unrelated', 'keep');
      const store = await loadStore();

      expect(store.initSession()).toBeUndefined();
      expect(localStorage.getItem(APP_SESSION_KEY)).toBeNull();
      expect(localStorage.getItem('unrelated')).toBe('keep');
      expect(mocks.signOutUser).toHaveBeenCalledOnce();
    });

    it('rejects a record with fields of the wrong type', async () => {
      storeRecord({ ...profile, authenticatedAt: 'yesterday' });
      const store = await loadStore();

      expect(store.initSession()).toBeUndefined();
      expect(localStorage.getItem(APP_SESSION_KEY)).toBeNull();
    });

    it('expires a stored session that is too old with one Snackbar', async () => {
      storeRecord({ ...profile, authenticatedAt: NOW - SESSION_LIFETIME_MS - 1 });
      const store = await loadStore();

      expect(store.initSession()).toBeUndefined();
      expect(localStorage.getItem(APP_SESSION_KEY)).toBeNull();
      expect(mocks.signOutUser).toHaveBeenCalledOnce();
      expect(snackbarMessages()).toEqual(['Your session has expired. Please log in again.']);
    });
  });

  describe('ensureActiveSession', () => {
    it('returns the session while it is still valid', async () => {
      const store = await loadStore();
      const session = store.startSession(profile);

      expect(store.ensureActiveSession()).toBe(session);
    });

    it('ends an expired session even if the timer has not fired yet', async () => {
      const store = await loadStore();
      store.startSession(profile);
      vi.setSystemTime(NOW + SESSION_LIFETIME_MS + 1000);

      expect(store.ensureActiveSession()).toBeUndefined();
      expect(store.getActiveSession()).toBeUndefined();
      expect(snackbarMessages()).toHaveLength(1);

      vi.runAllTimers();
      expect(snackbarMessages()).toHaveLength(1);
    });

    it('checks the session again when the tab becomes visible', async () => {
      const store = await loadStore();
      store.initSession();
      store.startSession(profile);
      vi.setSystemTime(NOW + SESSION_LIFETIME_MS);

      document.dispatchEvent(new Event('visibilitychange'));

      expect(store.getActiveSession()).toBeUndefined();
    });

    it('checks the session again when the window regains focus', async () => {
      const store = await loadStore();
      store.initSession();
      store.startSession(profile);
      vi.setSystemTime(NOW + SESSION_LIFETIME_MS);

      globalThis.dispatchEvent(new Event('focus'));

      expect(store.getActiveSession()).toBeUndefined();
    });
  });

  describe('logout', () => {
    it('clears only the app session, signs out and confirms', async () => {
      localStorage.setItem('unrelated', 'keep');
      const store = await loadStore();
      const listener = vi.fn();
      store.startSession(profile);
      store.onSessionChange(listener);

      await store.logout();

      expect(store.getActiveSession()).toBeUndefined();
      expect(localStorage.getItem(APP_SESSION_KEY)).toBeNull();
      expect(localStorage.getItem('unrelated')).toBe('keep');
      expect(listener).toHaveBeenCalledWith(undefined);
      expect(mocks.signOutUser).toHaveBeenCalledOnce();
      expect(mocks.showSnackbar).toHaveBeenCalledWith({
        message: 'You have logged out.',
        variant: 'success',
      });
    });

    it('stays in guest mode and reports an error when Firebase sign-out fails', async () => {
      mocks.signOutUser.mockRejectedValue(new Error('network'));
      const store = await loadStore();
      store.startSession(profile);

      await store.logout();

      expect(store.getActiveSession()).toBeUndefined();
      expect(mocks.showSnackbar).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'error' }),
      );
      expect(mocks.showSnackbar).not.toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'success' }),
      );
    });

    it('cancels the pending expiry timer', async () => {
      const store = await loadStore();
      store.startSession(profile);

      await store.logout();
      vi.runAllTimers();

      expect(snackbarMessages()).toEqual(['You have logged out.']);
    });
  });

  it('stops notifying a listener after it unsubscribes', async () => {
    const store = await loadStore();
    const listener = vi.fn();
    store.onSessionChange(listener)();

    store.startSession(profile);

    expect(listener).not.toHaveBeenCalled();
  });
});
