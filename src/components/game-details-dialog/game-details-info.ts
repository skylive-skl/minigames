import { createElement } from '@/shared/lib/dom';
import { formatCompactNumber } from '@/shared/lib/format';
import type { GameDetails } from '@/shared/types/game';
import { createHeartIcon, createStarIcon } from '@/shared/ui/icon/icon';

export interface GameDetailsInfoController {
  readonly element: HTMLElement;
  readonly isFavorite: () => boolean;
  readonly resetFavorite: () => void;
}

interface SpecItem {
  readonly label: string;
  readonly value: string;
  readonly isPrice?: boolean;
}

export function createGameDetailsInfo(game: GameDetails): GameDetailsInfoController {
  let isFavoriteActive = game.isLikedByCurrentUser;

  const title = createElement('h2', {
    className: 'game-details-dialog__game-title',
    attributes: {
      id: 'game-details-title',
    },
    text: game.name,
  });

  const starIcon = createStarIcon();
  starIcon.classList.add('game-details-dialog__stat-icon', 'game-details-dialog__stat-icon--star');

  const ratingStat = createElement('div', {
    className: 'game-details-dialog__stat',
    children: [
      starIcon,
      createElement('span', {
        className: 'game-details-dialog__stat-value',
        text: game.rating.toFixed(1),
      }),
    ],
  });

  const heartIcon = createHeartIcon();
  heartIcon.classList.add(
    'game-details-dialog__stat-icon',
    'game-details-dialog__stat-icon--likes',
  );

  const likesStat = createElement('div', {
    className: 'game-details-dialog__stat',
    children: [
      heartIcon,
      createElement('span', {
        className: 'game-details-dialog__stat-value',
        text: formatCompactNumber(game.likesCount),
      }),
    ],
  });

  const stats = createElement('div', {
    className: 'game-details-dialog__stats',
    children: [ratingStat, likesStat],
  });

  const headerRow = createElement('div', {
    className: 'game-details-dialog__info-header',
    children: [title, stats],
  });

  const specItems: readonly SpecItem[] = [
    { label: 'Genre', value: game.specs.genre },
    { label: 'Players', value: game.specs.players },
    { label: 'Duration', value: game.specs.duration },
    { label: 'Price', value: game.specs.price, isPrice: true },
  ];

  const badgesList = createElement('ul', {
    className: 'game-details-dialog__badges',
    attributes: { 'aria-label': 'Game specifications' },
    children: specItems.map((spec) => {
      const labelSpan = createElement('span', {
        className: 'game-details-dialog__badge-label',
        text: `${spec.label}:`,
      });
      const valueSpan = createElement('span', {
        className: `game-details-dialog__badge-value${spec.isPrice ? ' game-details-dialog__badge-value--price' : ''}`,
        text: spec.value,
      });

      return createElement('li', {
        className: 'game-details-dialog__badge',
        children: [labelSpan, valueSpan],
      });
    }),
  });

  const description = createElement('p', {
    className: 'game-details-dialog__description',
    text: game.fullDescription,
  });

  const playButton = createElement('button', {
    className: 'game-details-dialog__button game-details-dialog__button--play',
    attributes: { type: 'button' },
    text: 'Play Now',
    onClick: (event) => {
      event.preventDefault();
      // Click intentionally performs no action per requirements
    },
  });

  const favoriteIcon = createHeartIcon();
  favoriteIcon.classList.add('game-details-dialog__button-icon');

  const favoriteText = createElement('span', {
    className: 'game-details-dialog__button-text',
    text: isFavoriteActive ? 'In Favorites' : 'Add to Favorites',
  });

  const favoriteButton = createElement('button', {
    className: `game-details-dialog__button game-details-dialog__button--favorite${isFavoriteActive ? ' game-details-dialog__button--favorite-active' : ''}`,
    attributes: {
      type: 'button',
      'aria-pressed': String(isFavoriteActive),
    },
    children: [favoriteIcon, favoriteText],
    onClick: () => {
      isFavoriteActive = !isFavoriteActive;
      updateFavoriteState();
    },
  });

  function updateFavoriteState(): void {
    favoriteButton.setAttribute('aria-pressed', String(isFavoriteActive));
    if (isFavoriteActive) {
      favoriteButton.classList.add('game-details-dialog__button--favorite-active');
      favoriteText.textContent = 'In Favorites';
    } else {
      favoriteButton.classList.remove('game-details-dialog__button--favorite-active');
      favoriteText.textContent = 'Add to Favorites';
    }
  }

  const actions = createElement('div', {
    className: 'game-details-dialog__actions',
    children: [playButton, favoriteButton],
  });

  const section = createElement('section', {
    className: 'game-details-dialog__info',
    attributes: { 'aria-labelledby': 'game-details-title' },
    children: [headerRow, badgesList, description, actions],
  });

  return {
    element: section,
    isFavorite: (): boolean => isFavoriteActive,
    resetFavorite: (): void => {
      isFavoriteActive = false;
      updateFavoriteState();
    },
  };
}
