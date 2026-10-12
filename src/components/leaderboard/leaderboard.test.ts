import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/shared/api/http';
import { fetchLeaderboard } from '@/shared/api/leaderboard-api';
import type { LeaderboardEntry } from '@/shared/types/player';
import { showSnackbar } from '@/shared/ui/snackbar/snackbar';
import { createLeaderboard } from './leaderboard';

vi.mock('@/shared/api/leaderboard-api', () => ({ fetchLeaderboard: vi.fn() }));
vi.mock('@/shared/ui/snackbar/snackbar', () => ({ showSnackbar: vi.fn() }));

function entry(rank: number, overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    rank,
    playerName: 'PixelMaster99',
    gamesPlayed: 1240,
    totalScore: 98_750,
    streakDays: 1,
    favoriteGameSlug: 'tiny-glade',
    favoriteGameName: 'Tiny Glade',
    ...overrides,
  };
}

async function mountLeaderboard(): Promise<HTMLElement> {
  const leaderboard = createLeaderboard();
  document.body.append(leaderboard.element);
  await vi.waitFor(() => {
    expect(
      leaderboard.element.querySelector('.leaderboard__content')?.getAttribute('aria-busy'),
    ).toBe('false');
  });
  return leaderboard.element;
}

describe('leaderboard', () => {
  it('shows five skeleton rows while loading', () => {
    vi.mocked(fetchLeaderboard).mockReturnValue(
      Promise.withResolvers<readonly LeaderboardEntry[]>().promise,
    );

    const leaderboard = createLeaderboard();

    expect(leaderboard.element.querySelectorAll(':scope tbody tr')).toHaveLength(5);
    expect(leaderboard.element.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
  });

  it('renders one formatted row per player', async () => {
    vi.mocked(fetchLeaderboard).mockResolvedValue([
      entry(1),
      entry(2, { playerName: 'CozyGamer', streakDays: 12 }),
      entry(4, { playerName: 'ann' }),
    ]);

    const element = await mountLeaderboard();
    const rows = [...element.querySelectorAll(':scope tbody tr')];

    expect(rows).toHaveLength(3);
    const [first, second, fourth] = rows as [Element, Element, Element];
    expect(first.querySelector('.leaderboard__cell--rank')?.textContent).toBe('#1');
    expect(first.querySelector('.leaderboard__avatar')?.textContent).toBe('PM');
    expect(first.querySelector('.leaderboard__cell--games')?.textContent).toBe('1,240');
    expect(first.querySelector('.leaderboard__cell--score')?.textContent).toBe('98,75098.7K');
    expect(first.querySelector('.leaderboard__cell--streak')?.textContent).toBe('🔥1 day1d');
    expect(second.querySelector('.leaderboard__cell--streak')?.textContent).toBe('🔥12 days12d');
    expect(first.querySelector('.leaderboard__chip')?.textContent).toBe('Tiny Glade');
    // Rows past the third are hidden on tablet.
    expect(fourth.classList.contains('leaderboard__row--extra')).toBe(true);
    expect(fourth.querySelector('.leaderboard__avatar')?.textContent).toBe('');
  });

  it('shows an empty state when nobody played this week', async () => {
    vi.mocked(fetchLeaderboard).mockResolvedValue([]);

    const element = await mountLeaderboard();

    expect(element.textContent).toContain('No players yet');
  });

  it('shows an error banner and Snackbar, then retries', async () => {
    vi.mocked(fetchLeaderboard)
      .mockRejectedValueOnce(new ApiError('Network error.', 0))
      .mockResolvedValue([entry(1)]);

    const element = await mountLeaderboard();

    expect(element.textContent).toContain('Could not load the leaderboard');
    expect(showSnackbar).toHaveBeenCalledWith({
      message: 'Failed to load the leaderboard.',
      variant: 'error',
    });

    [...element.querySelectorAll('button')]
      .find((button) => button.textContent === 'Try again')
      ?.click();

    await vi.waitFor(() => {
      expect(element.querySelectorAll(':scope tbody tr')).toHaveLength(1);
    });
  });
});
