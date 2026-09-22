import heartopiaCard from '@/assets/images/games/heartopia-card.jpg';
import paliaCard from '@/assets/images/games/palia-card.jpg';
import shelveThePotionsCard from '@/assets/images/games/shelve-the-potions-card.jpg';
import vacationCafeSimulatorCard from '@/assets/images/games/vacation-cafe-simulator-card.jpg';
import winterBurrowCard from '@/assets/images/games/winter-burrow-card.jpg';
import { formatCompactNumber } from '@/shared/lib/format';
import { createElement } from '@/shared/lib/dom';
import type { Game } from '@/shared/types/game';
import { createHeartIcon, createStarIcon } from '@/shared/ui/icon/icon';

const GAME_CARD_IMAGES: Readonly<Record<string, string>> = {
  'vacation-cafe-simulator': vacationCafeSimulatorCard,
  'winter-burrow': winterBurrowCard,
  'shelve-the-potions': shelveThePotionsCard,
  heartopia: heartopiaCard,
  palia: paliaCard,
};

export type CardPosition = 'edge' | 'side' | 'center';

export function createGameCard(game: Game, position: CardPosition): HTMLElement {
  const image = createElement('img', {
    className: 'game-card__image',
    attributes: {
      src: GAME_CARD_IMAGES[game.slug] ?? '',
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

  return createElement('article', {
    className: `game-card game-card--${position}`,
    children: [image, overlay],
  });
}
