import { beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_SESSION_KEY, SESSION_LIFETIME_MS } from '@/shared/auth/app-session';
import { removeGlobalListenersAfterEach } from '@/test/global-listeners';
import type { PageComponent } from './routes';

const mocks = vi.hoisted(() => ({
  showSnackbar: vi.fn(),
  signOutUser: vi.fn(() => Promise.resolve()),
  signInWithGoogle: vi.fn(),
  createStubPage: (): PageComponent => ({ element: document.createElement('section') }),
}));

vi.mock('@/shared/ui/snackbar/snackbar', () => ({ showSnackbar: mocks.showSnackbar }));
vi.mock('@/shared/auth/auth-service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/auth/auth-service')>()),
  signOutUser: mocks.signOutUser,
  signInWithGoogle: mocks.signInWithGoogle,
}));
vi.mock('./routes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./routes')>()),
  routes: {
    home: mocks.createStubPage,
    library: mocks.createStubPage,
    'not-found': mocks.createStubPage,
  },
}));

const BASE = import.meta.env.BASE_URL;
const ALREADY_AUTHENTICATED = { message: 'You are already logged in.', variant: 'info' };

// Router and session state live at module level: every test boots a fresh app.
async function startApp(url: string): Promise<HTMLElement> {
  vi.resetModules();
  globalThis.history.replaceState(undefined, '', `${BASE}${url}`);
  const { createApp } = await import('./app');
  const app = createApp();
  document.body.append(app.element);
  app.start();
  return app.element;
}

async function dispatchAuthOpen(mode: 'login' | 'register'): Promise<void> {
  const { dispatchAuthDialogOpen } = await import('@/shared/lib/app-events');
  const { DialogMode } = await import('@/shared/types/ui');
  dispatchAuthDialogOpen(mode === 'login' ? DialogMode.Login : DialogMode.Register);
}

function storeSession(authenticatedAt: number): void {
  localStorage.setItem(
    APP_SESSION_KEY,
    JSON.stringify({ displayName: 'Alex', email: 'alex@mail.com', authenticatedAt }),
  );
}

function isAuthDialogOpen(root: HTMLElement): boolean {
  return root.querySelector<HTMLDialogElement>('.auth-dialog')?.open ?? false;
}

describe('auth dialog guard', () => {
  removeGlobalListenersAfterEach();

  beforeEach(() => {
    mocks.showSnackbar.mockClear();
    mocks.signOutUser.mockClear();
  });

  it('opens Auth from the URL for guests', async () => {
    const root = await startApp('library?auth=register');

    expect(isAuthDialogOpen(root)).toBe(true);
    expect(globalThis.location.search).toBe('?auth=register');
  });

  it('blocks an Auth deep link for a signed-in user and cleans only "auth"', async () => {
    storeSession(Date.now());
    const historyLength = globalThis.history.length;

    const root = await startApp('library?category=puzzle&auth=login&page=2#top');

    expect(isAuthDialogOpen(root)).toBe(false);
    expect(globalThis.location.pathname).toBe(`${BASE}library`);
    expect(globalThis.location.search).toBe('?category=puzzle&page=2');
    expect(globalThis.location.hash).toBe('#top');
    expect(globalThis.history.length).toBe(historyLength);
    expect(mocks.showSnackbar).toHaveBeenCalledOnce();
    expect(mocks.showSnackbar).toHaveBeenCalledWith(ALREADY_AUTHENTICATED);
  });

  it('blocks Auth reached through browser history', async () => {
    storeSession(Date.now());
    const root = await startApp('library');
    globalThis.history.pushState(undefined, '', `${BASE}library?auth=login`);

    globalThis.dispatchEvent(new PopStateEvent('popstate'));

    expect(isAuthDialogOpen(root)).toBe(false);
    expect(globalThis.location.search).toBe('');
    expect(mocks.showSnackbar).toHaveBeenCalledWith(ALREADY_AUTHENTICATED);
  });

  it('blocks Auth opened from a UI control without adding a history entry', async () => {
    storeSession(Date.now());
    const root = await startApp('');
    const historyLength = globalThis.history.length;

    await dispatchAuthOpen('login');

    expect(isAuthDialogOpen(root)).toBe(false);
    expect(globalThis.history.length).toBe(historyLength);
    expect(globalThis.location.search).toBe('');
    expect(mocks.showSnackbar).toHaveBeenCalledWith(ALREADY_AUTHENTICATED);
  });

  it('lets a guest open Auth from a UI control', async () => {
    const root = await startApp('');

    await dispatchAuthOpen('register');

    expect(isAuthDialogOpen(root)).toBe(true);
    expect(globalThis.location.search).toBe('?auth=register');
  });

  it('treats an expired session as a guest and opens Auth', async () => {
    storeSession(Date.now() - SESSION_LIFETIME_MS - 1000);

    const root = await startApp('?auth=login');

    expect(isAuthDialogOpen(root)).toBe(true);
    expect(localStorage.getItem(APP_SESSION_KEY)).toBeNull();
    expect(mocks.signOutUser).toHaveBeenCalled();
    expect(mocks.showSnackbar).not.toHaveBeenCalledWith(ALREADY_AUTHENTICATED);
  });

  it('treats an invalid stored session as a guest and opens Auth', async () => {
    localStorage.setItem(APP_SESSION_KEY, '{"displayName": 1}');

    const root = await startApp('?auth=login');

    expect(isAuthDialogOpen(root)).toBe(true);
    expect(localStorage.getItem(APP_SESSION_KEY)).toBeNull();
  });
});

function isGameDetailsOpen(root: HTMLElement): boolean {
  return root.querySelector<HTMLDialogElement>('.game-details-dialog')?.open ?? false;
}

describe('protected action from Game Details', () => {
  removeGlobalListenersAfterEach();

  beforeEach(() => {
    mocks.showSnackbar.mockClear();
    // Game Details requests never settle: these tests only follow the dialogs.
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>(() => {
            // Never settles.
          }),
      ),
    );
  });

  it('swaps Game Details for Auth while keeping the game in the URL', async () => {
    const root = await startApp('library?game=tiny-glade');
    expect(isGameDetailsOpen(root)).toBe(true);
    const { requireSession } = await import('@/shared/auth/protected-action');

    expect(requireSession('Log in to like comments.')).toBeUndefined();

    expect(isGameDetailsOpen(root)).toBe(false);
    expect(isAuthDialogOpen(root)).toBe(true);
    const parameters = new URLSearchParams(globalThis.location.search);
    expect(parameters.get('game')).toBe('tiny-glade');
    expect(parameters.get('auth')).toBe('login');
  });

  it('restores Game Details in guest mode when Auth is closed', async () => {
    const root = await startApp('library?game=tiny-glade');
    const { requireSession } = await import('@/shared/auth/protected-action');
    requireSession('Log in to like comments.');

    // Backdrop click closes Auth and steps back to the Game Details entry.
    root.querySelector('.auth-dialog')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await vi.waitFor(() => {
      expect(isGameDetailsOpen(root)).toBe(true);
    });
    expect(isAuthDialogOpen(root)).toBe(false);
    expect(globalThis.location.search).toBe('?game=tiny-glade');
    const { getActiveSession } = await import('@/shared/auth/session-store');
    expect(getActiveSession()).toBeUndefined();
  });

  it('restores Game Details in authenticated mode after signing in', async () => {
    mocks.signInWithGoogle.mockResolvedValue({ displayName: 'Alex', email: 'alex@mail.com' });
    const root = await startApp('library?game=tiny-glade');
    const { requireSession } = await import('@/shared/auth/protected-action');
    requireSession('Log in to add games to favorites.');

    // The panel shown last is the active one (it may still be fading in).
    [...root.querySelectorAll<HTMLButtonElement>('.auth-dialog__google-button')].at(-1)?.click();

    await vi.waitFor(() => {
      expect(isGameDetailsOpen(root)).toBe(true);
    });
    expect(isAuthDialogOpen(root)).toBe(false);
    expect(globalThis.location.search).toBe('?game=tiny-glade');
    const { getActiveSession } = await import('@/shared/auth/session-store');
    expect(getActiveSession()?.email).toBe('alex@mail.com');
  });
});
