import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_DIALOG_OPEN_EVENT } from '@/shared/lib/app-events';
import { showSnackbar } from '@/shared/ui/snackbar/snackbar';
import { SESSION_LIFETIME_MS } from './app-session';
import { requireSession } from './protected-action';
import { getActiveSession, logout, startSession } from './session-store';

vi.mock('./auth-service', () => ({ signOutUser: vi.fn(() => Promise.resolve()) }));
vi.mock('@/shared/ui/snackbar/snackbar', () => ({ showSnackbar: vi.fn() }));

const WARNING = 'Log in to add games to favorites.';
const profile = { displayName: 'Alex', email: 'alex@mail.com' };

describe('requireSession', () => {
  const authRequests = vi.fn();

  beforeEach(() => {
    document.addEventListener(AUTH_DIALOG_OPEN_EVENT, authRequests);
  });

  afterEach(async () => {
    document.removeEventListener(AUTH_DIALOG_OPEN_EVENT, authRequests);
    authRequests.mockClear();
    vi.useRealTimers();
    await logout();
  });

  it('returns the active session and lets the action proceed', () => {
    const session = startSession(profile);

    expect(requireSession(WARNING)).toBe(session);
    expect(authRequests).not.toHaveBeenCalled();
    expect(showSnackbar).not.toHaveBeenCalled();
  });

  it('warns a guest and asks to open Login instead', () => {
    expect(requireSession(WARNING)).toBeUndefined();

    expect(showSnackbar).toHaveBeenCalledWith({ message: WARNING, variant: 'warning' });
    expect(authRequests).toHaveBeenCalledWith(expect.objectContaining({ detail: 'login' }));
  });

  it('ends an expired session with one Snackbar and opens Login', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    startSession(profile);
    vi.setSystemTime(Date.now() + SESSION_LIFETIME_MS + 1);

    expect(requireSession(WARNING)).toBeUndefined();

    expect(getActiveSession()).toBeUndefined();
    expect(showSnackbar).toHaveBeenCalledOnce();
    expect(showSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Your session has expired. Please log in again.' }),
    );
    expect(authRequests).toHaveBeenCalledOnce();
  });
});
