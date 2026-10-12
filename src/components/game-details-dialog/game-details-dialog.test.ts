import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchLatestComments } from '@/shared/api/comments-api';
import { fetchGameDetails, toggleFavorite } from '@/shared/api/games-api';
import { ApiError } from '@/shared/api/http';
import { AUTH_DIALOG_OPEN_EVENT } from '@/shared/lib/app-events';
import { getActiveSession, logout, startSession } from '@/shared/auth/session-store';
import { SESSION_LIFETIME_MS } from '@/shared/auth/app-session';
import type { GameComment, GameDetails } from '@/shared/types/game';
import { showSnackbar } from '@/shared/ui/snackbar/snackbar';
import { createGameDetailsDialog } from './game-details-dialog';

vi.mock('@/shared/api/games-api', () => ({ fetchGameDetails: vi.fn(), toggleFavorite: vi.fn() }));
vi.mock('@/shared/api/comments-api', () => ({ fetchLatestComments: vi.fn() }));
vi.mock('@/shared/auth/auth-service', () => ({ signOutUser: vi.fn(() => Promise.resolve()) }));
vi.mock('@/shared/ui/snackbar/snackbar', () => ({ showSnackbar: vi.fn() }));

const gameDetails: GameDetails = {
  slug: 'tiny-glade',
  name: 'Tiny Glade',
  heroImage: '',
  rating: 4.8,
  likesCount: 31_200,
  isLikedByCurrentUser: false,
  fullDescription: 'Build castles.',
  specs: { genre: 'Building', players: '1', duration: '∞', price: 'Free' },
  topRecords: [{ position: 1, playerName: 'Ann', score: 1200, achievedAt: '2026-10-01T00:00:00Z' }],
};

const comment: GameComment = {
  commentId: 'c1',
  authorName: 'ForestDweller',
  text: 'Lovely!',
  likesCount: 2,
  isLikedByCurrentUser: false,
  createdAt: '2026-10-01T00:00:00Z',
};

const profile = { displayName: 'Alex', email: 'alex@mail.com' };

// Dialogs subscribe to the shared session store: destroy them after each test.
const mountedDialogs: ReturnType<typeof createGameDetailsDialog>[] = [];

function mountDialog(
  options: Parameters<typeof createGameDetailsDialog>[0] = {},
): ReturnType<typeof createGameDetailsDialog> {
  const gameDialog = createGameDetailsDialog(options);
  mountedDialogs.push(gameDialog);
  document.body.append(gameDialog.element);
  return gameDialog;
}

function openDialog(slug = 'tiny-glade'): ReturnType<typeof createGameDetailsDialog> {
  const gameDialog = mountDialog();
  gameDialog.open(slug);
  return gameDialog;
}

function lastRequestOptions(mock: typeof fetchGameDetails | typeof fetchLatestComments): unknown {
  return vi.mocked(mock).mock.lastCall?.[1];
}

function textOf(root: Element, selector: string): string | null | undefined {
  return root.querySelector(selector)?.textContent;
}

describe('game details dialog', () => {
  beforeEach(() => {
    vi.mocked(fetchGameDetails).mockResolvedValue(gameDetails);
    vi.mocked(fetchLatestComments).mockResolvedValue({
      data: [comment],
      meta: { totalComments: 12, returnedCount: 1, sort: 'newest' },
    });
  });

  afterEach(async () => {
    for (const gameDialog of mountedDialogs.splice(0)) {
      gameDialog.destroy?.();
    }
    await logout();
  });

  it('loads guest details and comments without userEmail', async () => {
    const gameDialog = openDialog();

    await vi.waitFor(() => {
      expect(textOf(gameDialog.element, '.game-details-dialog__game-title')).toBe('Tiny Glade');
    });
    expect(vi.mocked(fetchGameDetails).mock.lastCall?.[0]).toBe('tiny-glade');
    expect(lastRequestOptions(fetchGameDetails)).toMatchObject({ userEmail: undefined });
    expect(lastRequestOptions(fetchLatestComments)).toMatchObject({ userEmail: undefined });
    expect(textOf(gameDialog.element, '#game-details-comments-heading')).toBe('Comments (12)');
  });

  it('personalizes both requests for a signed-in user', () => {
    startSession(profile);

    openDialog();

    expect(fetchGameDetails).toHaveBeenCalledWith(
      'tiny-glade',
      expect.objectContaining({ userEmail: 'alex@mail.com' }),
    );
    expect(fetchLatestComments).toHaveBeenCalledWith(
      'tiny-glade',
      expect.objectContaining({ userEmail: 'alex@mail.com' }),
    );
  });

  it('reloads in authenticated mode when a session starts while open', () => {
    openDialog();
    vi.mocked(fetchGameDetails).mockClear();

    startSession(profile);

    expect(fetchGameDetails).toHaveBeenCalledOnce();
    expect(fetchGameDetails).toHaveBeenCalledWith(
      'tiny-glade',
      expect.objectContaining({ userEmail: 'alex@mail.com' }),
    );
  });

  it('reloads in guest mode after logout', async () => {
    startSession(profile);
    openDialog();
    vi.mocked(fetchGameDetails).mockClear();
    vi.mocked(fetchLatestComments).mockClear();

    await logout();

    expect(fetchGameDetails).toHaveBeenCalledWith(
      'tiny-glade',
      expect.objectContaining({ userEmail: undefined }),
    );
    expect(fetchLatestComments).toHaveBeenCalledWith(
      'tiny-glade',
      expect.objectContaining({ userEmail: undefined }),
    );
  });

  it('does not reload a closed dialog when the session changes', () => {
    const gameDialog = openDialog();
    gameDialog.close();
    vi.mocked(fetchGameDetails).mockClear();

    startSession(profile);

    expect(fetchGameDetails).not.toHaveBeenCalled();
  });

  it('keeps the game in the URL flow when hidden instead of closed', () => {
    const onClose = vi.fn();
    const gameDialog = mountDialog({ onClose });
    gameDialog.open('tiny-glade');

    gameDialog.hide();

    expect(gameDialog.getOpenSlug()).toBeUndefined();
    expect(onClose).not.toHaveBeenCalled();

    gameDialog.open('tiny-glade');
    gameDialog.close();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows Game Not Found for an unknown game', async () => {
    vi.mocked(fetchGameDetails).mockRejectedValue(new ApiError('Game not found: nope', 404));

    const gameDialog = openDialog('nope');

    await vi.waitFor(() => {
      expect(gameDialog.element.textContent).toContain('Game Not Found');
    });
    expect(showSnackbar).not.toHaveBeenCalled();
  });

  it('shows an error banner with a working Retry on failure', async () => {
    vi.mocked(fetchGameDetails).mockRejectedValueOnce(new ApiError('Server error', 500));

    const gameDialog = openDialog();

    const retry = await vi.waitFor(() => {
      const button = [...gameDialog.element.querySelectorAll('button')].find(
        (candidate) => candidate.textContent === 'Try again',
      );
      expect(button).toBeDefined();
      return button;
    });
    expect(showSnackbar).toHaveBeenCalledWith(expect.objectContaining({ variant: 'error' }));

    retry?.click();

    await vi.waitFor(() => {
      expect(textOf(gameDialog.element, '.game-details-dialog__game-title')).toBe('Tiny Glade');
    });
    expect(fetchGameDetails).toHaveBeenCalledTimes(2);
  });
});

function favoriteButtonOf(root: Element): HTMLButtonElement {
  const button = root.querySelector<HTMLButtonElement>('.game-details-dialog__button--favorite');
  if (button === null) {
    throw new Error('Favorite button is missing');
  }
  return button;
}

async function openLoadedDialog(): Promise<ReturnType<typeof createGameDetailsDialog>> {
  const gameDialog = openDialog();
  await vi.waitFor(() => {
    expect(textOf(gameDialog.element, '.game-details-dialog__game-title')).toBe('Tiny Glade');
  });
  return gameDialog;
}

describe('favorites toggle', () => {
  const authRequests = vi.fn();

  beforeEach(() => {
    vi.mocked(fetchGameDetails).mockResolvedValue(gameDetails);
    vi.mocked(fetchLatestComments).mockResolvedValue({
      data: [],
      meta: { totalComments: 0, returnedCount: 0, sort: 'newest' },
    });
    document.addEventListener(AUTH_DIALOG_OPEN_EVENT, authRequests);
  });

  afterEach(async () => {
    document.removeEventListener(AUTH_DIALOG_OPEN_EVENT, authRequests);
    authRequests.mockClear();
    vi.useRealTimers();
    for (const gameDialog of mountedDialogs.splice(0)) {
      gameDialog.destroy?.();
    }
    await logout();
  });

  it('initializes the button from the personalized details', async () => {
    vi.mocked(fetchGameDetails).mockResolvedValue({ ...gameDetails, isLikedByCurrentUser: true });
    startSession(profile);

    const gameDialog = await openLoadedDialog();

    expect(favoriteButtonOf(gameDialog.element).getAttribute('aria-pressed')).toBe('true');
  });

  it('opens Auth with a warning for guests and sends no request', async () => {
    const gameDialog = await openLoadedDialog();

    favoriteButtonOf(gameDialog.element).click();

    expect(toggleFavorite).not.toHaveBeenCalled();
    expect(authRequests).toHaveBeenCalledOnce();
    expect(showSnackbar).toHaveBeenCalledWith({
      message: 'Log in to add games to your favorites.',
      variant: 'warning',
    });
  });

  it('does not send the request once the session has expired', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    startSession(profile);
    const gameDialog = await openLoadedDialog();
    vi.setSystemTime(Date.now() + SESSION_LIFETIME_MS + 1);

    favoriteButtonOf(gameDialog.element).click();

    expect(toggleFavorite).not.toHaveBeenCalled();
    expect(getActiveSession()).toBeUndefined();
    expect(authRequests).toHaveBeenCalledOnce();
  });

  it('locks the button while pending and applies the server response', async () => {
    startSession(profile);
    const gameDialog = await openLoadedDialog();
    const pending = Promise.withResolvers<Awaited<ReturnType<typeof toggleFavorite>>>();
    vi.mocked(toggleFavorite).mockReturnValue(pending.promise);
    const button = favoriteButtonOf(gameDialog.element);

    button.click();
    button.click();

    expect(toggleFavorite).toHaveBeenCalledOnce();
    expect(toggleFavorite).toHaveBeenCalledWith('tiny-glade', 'alex@mail.com');
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.querySelector('.spinner')).not.toBeNull();

    pending.resolve({ gameSlug: 'tiny-glade', isFavorited: true, likesCount: 31_201 });

    await vi.waitFor(() => {
      expect(button.disabled).toBe(false);
    });
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(gameDialog.element.textContent).toContain('31.2K');
    expect(showSnackbar).toHaveBeenCalledWith({
      message: 'Added to favorites.',
      variant: 'success',
    });
  });

  it('keeps the confirmed state and unlocks when the server rejects', async () => {
    startSession(profile);
    const gameDialog = await openLoadedDialog();
    vi.mocked(toggleFavorite).mockRejectedValue(new ApiError('Game not found: tiny-glade', 404));
    const button = favoriteButtonOf(gameDialog.element);

    button.click();

    await vi.waitFor(() => {
      expect(showSnackbar).toHaveBeenCalledWith({
        message: 'Could not update favorites. Game not found: tiny-glade',
        variant: 'error',
      });
    });
    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('reports an unknown outcome without replaying the toggle', async () => {
    startSession(profile);
    const gameDialog = await openLoadedDialog();
    vi.mocked(toggleFavorite).mockRejectedValue(new ApiError('The request timed out.', 0));

    favoriteButtonOf(gameDialog.element).click();

    await vi.waitFor(() => {
      expect(showSnackbar).toHaveBeenCalledWith(expect.objectContaining({ variant: 'warning' }));
    });
    expect(toggleFavorite).toHaveBeenCalledOnce();
    expect(favoriteButtonOf(gameDialog.element).getAttribute('aria-pressed')).toBe('false');
  });
});
