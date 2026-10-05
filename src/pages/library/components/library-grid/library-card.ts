import { dispatchGameDetailsOpen } from '@/shared/lib/app-events';
import { createElement } from '@/shared/lib/dom';
import { formatCompactNumber } from '@/shared/lib/format';
import { getGameImageUrl } from '@/shared/lib/game-images';
import type { Game } from '@/shared/types/game';
import { createHeartIcon, createStarIcon } from '@/shared/ui/icon/icon';
import './library-card.scss';

export function createLibraryCard(game: Game): HTMLElement {
  const isFree = game.price.toLowerCase().includes('free');
  const priceModifier = isFree ? 'library-card__price--free' : 'library-card__price--paid';

  const categoryLabel = game.category.charAt(0).toUpperCase() + game.category.slice(1);

  const image = createElement('img', {
    className: 'library-card__image',
    attributes: {
      src: getGameImageUrl(game.slug, 'card'),
      alt: game.name,
      loading: 'lazy',
    },
  });

  const media = createElement('div', {
    className: 'library-card__media',
    children: [image],
  });

  const title = createElement('h2', {
    className: 'library-card__title',
    text: game.name,
  });

  const categoryPill = createElement('span', {
    className: 'library-card__category',
    text: categoryLabel,
  });

  const titleGroup = createElement('div', {
    className: 'library-card__title-group',
    children: [title, categoryPill],
  });

  const desktopPrice = createElement('span', {
    className: `library-card__price library-card__price--desktop ${priceModifier}`,
    text: game.price,
  });

  const cardHeader = createElement('div', {
    className: 'library-card__header',
    children: [titleGroup, desktopPrice],
  });

  const description = createElement('p', {
    className: 'library-card__description',
    text: game.shortDescription,
  });

  const rating = createElement('span', {
    className: 'library-card__rating',
    children: [createStarIcon('outline'), createElement('span', { text: game.rating.toFixed(1) })],
  });

  const likes = createElement('span', {
    className: 'library-card__likes',
    children: [
      createHeartIcon('outline'),
      createElement('span', { text: formatCompactNumber(game.likesCount) }),
    ],
  });

  const stats = createElement('div', {
    className: 'library-card__stats',
    children: [rating, likes],
  });

  const mobilePrice = createElement('span', {
    className: `library-card__price library-card__price--mobile ${priceModifier}`,
    text: game.price,
  });

  const meta = createElement('div', {
    className: 'library-card__meta',
    children: [stats, mobilePrice],
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
    children: [meta, detailsButton],
  });

  const body = createElement('div', {
    className: 'library-card__body',
    children: [cardHeader, description, footer],
  });

  return createElement('article', {
    className: 'library-card',
    children: [media, body],
  });
}
