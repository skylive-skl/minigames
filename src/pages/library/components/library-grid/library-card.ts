import { dispatchGameDetailsOpen } from '@/shared/lib/app-events';
import { createElement } from '@/shared/lib/dom';
import { formatCompactNumber } from '@/shared/lib/format';
import type { Game } from '@/shared/types/game';
import { createHeartIcon, createStarIcon } from '@/shared/ui/icon/icon';
import './library-card.scss';

const cardImageModules = import.meta.glob<string>('/src/assets/images/games/*-card.jpg', {
  eager: true,
  import: 'default',
});

function getCardImageUrl(slug: string): string {
  const path = `/src/assets/images/games/${slug}-card.jpg`;
  return cardImageModules[path] ?? '';
}

export function createLibraryCard(game: Game): HTMLElement {
  const isFree = game.price.toLowerCase().includes('free');
  const badgeClass = isFree
    ? 'library-card__badge library-card__badge--free'
    : 'library-card__badge library-card__badge--paid';

  const badge = createElement('span', {
    className: badgeClass,
    text: game.price,
  });

  const image = createElement('img', {
    className: 'library-card__image',
    attributes: {
      src: getCardImageUrl(game.slug),
      alt: game.name,
      loading: 'lazy',
    },
  });

  const media = createElement('div', {
    className: 'library-card__media',
    children: [image, badge],
  });

  const title = createElement('h2', {
    className: 'library-card__title',
    text: game.name,
  });

  const rating = createElement('span', {
    className: 'library-card__rating',
    children: [createStarIcon(), createElement('span', { text: game.rating.toFixed(1) })],
  });

  const likes = createElement('span', {
    className: 'library-card__likes',
    children: [
      createHeartIcon(),
      createElement('span', { text: formatCompactNumber(game.likesCount) }),
    ],
  });

  const meta = createElement('div', {
    className: 'library-card__meta',
    children: [rating, likes],
  });

  const description = createElement('p', {
    className: 'library-card__description',
    text: game.shortDescription,
  });

  const detailsButton = createElement('button', {
    className: 'library-card__button',
    text: 'Details',
    attributes: {
      type: 'button',
      'aria-label': `View details for ${game.name}`,
    },
    onClick: () => {
      dispatchGameDetailsOpen(game.slug);
    },
  });

  const footer = createElement('div', {
    className: 'library-card__footer',
    children: [detailsButton],
  });

  const body = createElement('div', {
    className: 'library-card__body',
    children: [title, meta, description, footer],
  });

  return createElement('article', {
    className: 'library-card',
    children: [media, body],
  });
}
