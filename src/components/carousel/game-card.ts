import { createElement } from '@/shared/lib/dom';
import { formatCompactNumber } from '@/shared/lib/format';
import { getGameImageUrl } from '@/shared/lib/game-images';
import type { Game } from '@/shared/types/game';
import { createHeartIcon, createStarIcon } from '@/shared/ui/icon/icon';

export type CardPosition = 'edge' | 'side' | 'center' | 'outer';

export function createGameCard(
  game: Game,
  position: CardPosition,
  onClick?: () => void,
): HTMLElement {
  const image = createElement('img', {
    className: 'game-card__image',
    attributes: {
      src: getGameImageUrl(game.slug, 'card'),
      alt: game.name,
      loading: 'lazy',
    },
  });

  const title = createElement('h3', { className: 'game-card__title', text: game.name });

  const rating = createElement('span', {
    className: 'game-card__rating',
    children: [createStarIcon(), createElement('span', { text: game.rating.toFixed(1) })],
  });

  const likes = createElement('span', {
    className: 'game-card__likes',
    children: [
      createHeartIcon(),
      createElement('span', { text: formatCompactNumber(game.likesCount) }),
    ],
  });

  const meta = createElement('div', { className: 'game-card__meta', children: [rating, likes] });

  const overlay = createElement('div', {
    className: 'game-card__overlay',
    children: [title, meta],
  });

  const card = createElement('article', {
    className: `game-card game-card--${position}`,
    attributes: {
      tabindex: '0',
      role: 'button',
      'aria-label': `${game.name} - Open game details`,
    },
    children: [image, overlay],
    onClick: () => {
      onClick?.();
    },
  });

  card.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    onClick?.();
  });

  return card;
}
