import { isAbortError } from '@/shared/api/http';
import { fetchLeaderboard } from '@/shared/api/leaderboard-api';
import { createElement } from '@/shared/lib/dom';
import {
  formatCompactNumber,
  formatStreakDays,
  formatStreakDaysCompact,
  formatThousands,
} from '@/shared/lib/format';
import type { Component } from '@/shared/types/component';
import type { LeaderboardEntry } from '@/shared/types/player';
import { createEmptyState, createErrorBanner } from '@/shared/ui/feedback-state/feedback-state';
import { createSkeleton, createSkeletonList, setBusy } from '@/shared/ui/skeleton/skeleton';
import { showSnackbar } from '@/shared/ui/snackbar/snackbar';
import './leaderboard.scss';

const NAME_WORD_PATTERN = /[A-Z][a-z0-9]*/gu;
const SKELETON_ROWS_COUNT = 5;
const VISIBLE_ROWS_ON_TABLET = 3;

function getInitials(playerName: string): string {
  const words = playerName.match(NAME_WORD_PATTERN) ?? [];

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('');
}

function createDualValue(fullText: string, compactText: string): HTMLElement {
  return createElement('span', {
    children: [
      createElement('span', { className: 'leaderboard__value--full', text: fullText }),
      createElement('span', { className: 'leaderboard__value--compact', text: compactText }),
    ],
  });
}

function getRowClassName(position: number): string {
  return position > VISIBLE_ROWS_ON_TABLET
    ? 'leaderboard__row leaderboard__row--extra'
    : 'leaderboard__row';
}

function createRow(entry: LeaderboardEntry): HTMLTableRowElement {
  const rankCell = createElement('td', {
    className: 'leaderboard__cell leaderboard__cell--rank',
    text: `#${String(entry.rank)}`,
  });

  const avatar = createElement('span', {
    className: `leaderboard__avatar leaderboard__avatar--${String(entry.rank)}`,
    text: getInitials(entry.playerName),
    attributes: { 'aria-hidden': 'true' },
  });
  const playerName = createElement('span', {
    className: 'leaderboard__player-name',
    text: entry.playerName,
  });
  const playerCell = createElement('td', {
    className: 'leaderboard__cell leaderboard__cell--player',
    children: [avatar, playerName],
  });

  const gamesCell = createElement('td', {
    className: 'leaderboard__cell leaderboard__cell--games',
    text: formatThousands(entry.gamesPlayed),
  });

  const scoreCell = createElement('td', {
    className: 'leaderboard__cell leaderboard__cell--score',
    children: [
      createDualValue(formatThousands(entry.totalScore), formatCompactNumber(entry.totalScore)),
    ],
  });

  const streakCell = createElement('td', {
    className: 'leaderboard__cell leaderboard__cell--streak',
    children: [
      createElement('span', {
        className: 'leaderboard__flame',
        attributes: { 'aria-hidden': 'true' },
        text: '🔥',
      }),
      createDualValue(
        formatStreakDays(entry.streakDays),
        formatStreakDaysCompact(entry.streakDays),
      ),
    ],
  });

  const favoriteChip = createElement('span', {
    className: 'leaderboard__chip',
    text: entry.favoriteGameName,
  });
  const favoriteCell = createElement('td', {
    className: 'leaderboard__cell leaderboard__cell--favorite',
    children: [favoriteChip],
  });

  const rowClassName = getRowClassName(entry.rank);

  return createElement('tr', {
    className: rowClassName,
    children: [rankCell, playerCell, gamesCell, scoreCell, streakCell, favoriteCell],
  });
}

function createSkeletonCell(modifier: string, content: HTMLElement[]): HTMLTableCellElement {
  return createElement('td', {
    className: `leaderboard__cell leaderboard__cell--${modifier}`,
    children: content,
  });
}

function createSkeletonText(): HTMLElement {
  return createSkeleton({ shape: 'text', className: 'leaderboard__skeleton-text' });
}

function createSkeletonRow(position: number): HTMLTableRowElement {
  return createElement('tr', {
    className: getRowClassName(position),
    children: [
      createSkeletonCell('rank', [createSkeletonText()]),
      createSkeletonCell('player', [
        createSkeleton({ shape: 'circle', className: 'leaderboard__avatar-skeleton' }),
        createSkeletonText(),
      ]),
      createSkeletonCell('games', [createSkeletonText()]),
      createSkeletonCell('score', [createSkeletonText()]),
      createSkeletonCell('streak', [createSkeletonText()]),
      createSkeletonCell('favorite', [createSkeletonText()]),
    ],
  });
}

function createHeaderCell(label: string, className: string): HTMLTableCellElement {
  return createElement('th', {
    className: `leaderboard__heading-cell ${className}`,
    attributes: { scope: 'col' },
    text: label,
  });
}

function createResponsiveHeaderCell(
  fullLabel: string,
  shortLabel: string,
  className: string,
): HTMLTableCellElement {
  return createElement('th', {
    className: `leaderboard__heading-cell ${className}`,
    attributes: { scope: 'col' },
    children: [createDualValue(fullLabel, shortLabel)],
  });
}

export function createLeaderboard(): Component {
  let abortController: AbortController | undefined;

  const accent = createElement('span', {
    className: 'leaderboard__accent',
    attributes: { 'aria-hidden': 'true' },
  });
  const heading = createElement('h2', {
    className: 'leaderboard__heading',
    text: 'Top Players This Week',
  });
  const header = createElement('div', {
    className: 'leaderboard__header',
    children: [accent, heading],
  });

  const caption = createElement('caption', {
    className: 'visually-hidden',
    text: 'Top players leaderboard',
  });

  const headRow = createElement('tr', {
    children: [
      createHeaderCell('Rank', 'leaderboard__heading-cell--rank'),
      createHeaderCell('Player', 'leaderboard__heading-cell--player'),
      createResponsiveHeaderCell('Games Played', 'Games', 'leaderboard__heading-cell--games'),
      createResponsiveHeaderCell('Total Score', 'Score', 'leaderboard__heading-cell--score'),
      createHeaderCell('Streak', 'leaderboard__heading-cell--streak'),
      createHeaderCell('Favorite Game', 'leaderboard__heading-cell--favorite'),
    ],
  });
  const thead = createElement('thead', { children: [headRow] });
  const tbody = createElement('tbody');

  const table = createElement('table', {
    className: 'leaderboard__table',
    children: [caption, thead, tbody],
  });

  const content = createElement('div', { className: 'leaderboard__content' });

  const element = createElement('section', {
    className: 'leaderboard',
    attributes: { 'aria-label': 'Top Players This Week' },
    children: [header, content],
  });

  function showLoading(): void {
    let position = 0;
    tbody.replaceChildren(
      ...createSkeletonList(SKELETON_ROWS_COUNT, () => {
        position += 1;
        return createSkeletonRow(position);
      }),
    );
    content.replaceChildren(table);
    setBusy(content, true);
  }

  function showEntries(entries: readonly LeaderboardEntry[]): void {
    setBusy(content, false);

    if (entries.length === 0) {
      content.replaceChildren(
        createEmptyState({
          title: 'No players yet',
          message: 'The leaderboard is empty this week. Play a game to get on it!',
        }),
      );
      return;
    }

    tbody.replaceChildren(...entries.map((entry) => createRow(entry)));
    content.replaceChildren(table);
  }

  function showError(message: string): void {
    setBusy(content, false);
    content.replaceChildren(
      createErrorBanner({
        title: 'Could not load the leaderboard',
        message,
        onRetry: () => {
          void load();
        },
      }),
    );
    showSnackbar({ message: 'Failed to load the leaderboard.', variant: 'error' });
  }

  async function load(): Promise<void> {
    abortController?.abort();
    const controller = new AbortController();
    abortController = controller;

    showLoading();

    try {
      const entries = await fetchLeaderboard(controller.signal);
      showEntries(entries);
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }
      showError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  void load();

  return {
    element,
    destroy: (): void => {
      abortController?.abort();
    },
  };
}
