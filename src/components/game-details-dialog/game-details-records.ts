import { createElement } from '@/shared/lib/dom';
import { formatRelativeTime, formatThousands } from '@/shared/lib/format';
import type { TopRecord } from '@/shared/types/game';

const MEDALS: Readonly<Record<number, string>> = {
  1: '\u{1F947}',
  2: '\u{1F948}',
  3: '\u{1F949}',
};

function createRecordItem(record: TopRecord): HTMLLIElement {
  const medal = createElement('span', {
    className: 'game-details-dialog__record-medal',
    attributes: { 'aria-hidden': 'true' },
    text: MEDALS[record.position] ?? `#${String(record.position)}`,
  });

  const rank = createElement('span', {
    className: 'game-details-dialog__visually-hidden',
    text: `Rank ${String(record.position)}: `,
  });

  const player = createElement('span', {
    className: 'game-details-dialog__record-player',
    children: [medal, rank, document.createTextNode(record.playerName)],
  });

  const score = createElement('span', {
    className: 'game-details-dialog__record-score',
    text: `${formatThousands(record.score)} pts`,
  });

  const date = createElement('time', {
    className: 'game-details-dialog__record-date',
    attributes: { datetime: record.achievedAt },
    text: formatRelativeTime(record.achievedAt),
  });

  const result = createElement('span', {
    className: 'game-details-dialog__record-result',
    children: [score, date],
  });

  return createElement('li', {
    className: 'game-details-dialog__record',
    children: [player, result],
  });
}

export function createGameDetailsRecords(records: readonly TopRecord[]): HTMLElement {
  const trophy = createElement('span', {
    attributes: { 'aria-hidden': 'true' },
    text: '\u{1F3C6}',
  });

  const heading = createElement('h3', {
    className: 'game-details-dialog__section-title',
    attributes: {
      id: 'game-details-records-heading',
    },
    children: [trophy, document.createTextNode('Top Records')],
  });

  const list = createElement('ol', {
    className: 'game-details-dialog__records-list',
    children: records.map((record) => createRecordItem(record)),
  });

  return createElement('section', {
    className: 'game-details-dialog__records',
    attributes: { 'aria-labelledby': 'game-details-records-heading' },
    children: [heading, list],
  });
}
