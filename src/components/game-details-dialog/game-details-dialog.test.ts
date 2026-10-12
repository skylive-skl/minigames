import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchLatestComments } from '@/shared/api/comments-api';
import { fetchGameDetails } from '@/shared/api/games-api';
import { ApiError } from '@/shared/api/http';
import { logout, startSession } from '@/shared/auth/session-store';
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
