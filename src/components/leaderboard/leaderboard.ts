import leaderboardSeed from '@/shared/data/leaderboard.json';
import { createElement } from '@/shared/lib/dom';
import type { Component } from '@/shared/types/component';
import type { LeaderboardEntry } from '@/shared/types/player';
import './leaderboard.scss';

const NAME_WORD_PATTERN = /[A-Z][a-z0-9]*/gu;

function getInitials(playerName: string): string {
  const words = playerName.match(NAME_WORD_PATTERN) ?? [];

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('');
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
    text: String(entry.gamesPlayed),
  });

  const scoreCell = createElement('td', {
    className: 'leaderboard__cell leaderboard__cell--score',
    text: String(entry.totalScore),
  });

  const streakCell = createElement('td', {
    className: 'leaderboard__cell leaderboard__cell--streak',
    children: [
      createElement('span', {
        className: 'leaderboard__flame',
        attributes: { 'aria-hidden': 'true' },
        text: '🔥',
      }),
      createElement('span', { text: `${String(entry.streakDays)} days` }),
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

  return createElement('tr', {
    className: 'leaderboard__row',
    children: [rankCell, playerCell, gamesCell, scoreCell, streakCell, favoriteCell],
  });
}

function createHeaderCell(label: string, className: string): HTMLTableCellElement {
  return createElement('th', {
    className: `leaderboard__heading-cell ${className}`,
    attributes: { scope: 'col' },
    text: label,
  });
}

export function createLeaderboard(): Component {
  const entries = leaderboardSeed.data as LeaderboardEntry[];

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
      createHeaderCell('Games Played', 'leaderboard__heading-cell--games'),
      createHeaderCell('Total Score', 'leaderboard__heading-cell--score'),
      createHeaderCell('Streak', 'leaderboard__heading-cell--streak'),
      createHeaderCell('Favorite Game', 'leaderboard__heading-cell--favorite'),
    ],
  });
  const thead = createElement('thead', { children: [headRow] });

  const tbody = createElement('tbody', { children: entries.map((entry) => createRow(entry)) });

  const table = createElement('table', {
    className: 'leaderboard__table',
    children: [caption, thead, tbody],
  });

  const element = createElement('section', {
    className: 'leaderboard',
    attributes: { 'aria-label': 'Top Players This Week' },
    children: [header, table],
  });

  return { element };
}
