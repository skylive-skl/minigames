import { createElement } from '@/shared/lib/dom';
import { formatThousands } from '@/shared/lib/format';
import type { TopRecord } from '@/shared/types/game';

function formatRecordDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function createGameDetailsRecords(records: readonly TopRecord[]): HTMLElement {
  const heading = createElement('h3', {
    className: 'game-details-dialog__records-title',
    attributes: {
      id: 'game-details-records-heading',
    },
    text: 'Top Records',
  });

  const tableHeader = createElement('thead', {
    children: [
      createElement('tr', {
        className: 'game-details-dialog__records-header-row',
        children: [
          createElement('th', {
            className: 'game-details-dialog__records-th game-details-dialog__records-th--rank',
            text: 'Rank',
            attributes: { scope: 'col' },
          }),
          createElement('th', {
            className: 'game-details-dialog__records-th game-details-dialog__records-th--player',
            text: 'Player',
            attributes: { scope: 'col' },
          }),
          createElement('th', {
            className: 'game-details-dialog__records-th game-details-dialog__records-th--score',
            text: 'Score',
            attributes: { scope: 'col' },
          }),
          createElement('th', {
            className: 'game-details-dialog__records-th game-details-dialog__records-th--date',
            text: 'Date',
            attributes: { scope: 'col' },
          }),
        ],
      }),
    ],
  });

  const rows = records.map((record) => {
    const rankBadge = createElement('span', {
      className: `game-details-dialog__rank-badge game-details-dialog__rank-badge--${String(record.position)}`,
      text: `#${String(record.position)}`,
    });

    const rankCell = createElement('td', {
      className: 'game-details-dialog__records-td game-details-dialog__records-td--rank',
      children: [rankBadge],
    });

    const playerCell = createElement('td', {
      className: 'game-details-dialog__records-td game-details-dialog__records-td--player',
      text: record.playerName,
    });

    const scoreCell = createElement('td', {
      className: 'game-details-dialog__records-td game-details-dialog__records-td--score',
      text: `${formatThousands(record.score)} pts`,
    });

    const dateCell = createElement('td', {
      className: 'game-details-dialog__records-td game-details-dialog__records-td--date',
      children: [
        createElement('time', {
          attributes: { datetime: record.achievedAt },
          text: formatRecordDate(record.achievedAt),
        }),
      ],
    });

    return createElement('tr', {
      className: 'game-details-dialog__records-row',
      children: [rankCell, playerCell, scoreCell, dateCell],
    });
  });

  const tableBody = createElement('tbody', {
    children: rows,
  });

  const table = createElement('table', {
    className: 'game-details-dialog__records-table',
    children: [tableHeader, tableBody],
  });

  return createElement('section', {
    className: 'game-details-dialog__records',
    attributes: { 'aria-labelledby': 'game-details-records-heading' },
    children: [heading, table],
  });
}
