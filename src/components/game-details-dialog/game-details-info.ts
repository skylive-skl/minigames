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

  const starIcon = createStarIcon('outline');
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

  const heartIcon = createHeartIcon('outline');
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

  const description = createElement('p', {
    className: 'game-details-dialog__description',
    text: game.fullDescription,
  });

  const specItems: readonly SpecItem[] = [
    { label: 'Genre', value: game.specs.genre },
    { label: 'Players', value: game.specs.players },
    { label: 'Duration', value: game.specs.duration },
    { label: 'Price', value: game.specs.price },
  ];

  const specsList = createElement('dl', {
    className: 'game-details-dialog__specs',
    children: specItems.map((spec) =>
      createElement('div', {
        className: 'game-details-dialog__spec',
        children: [
          createElement('dt', { className: 'game-details-dialog__spec-label', text: spec.label }),
          createElement('dd', { className: 'game-details-dialog__spec-value', text: spec.value }),
        ],
      }),
    ),
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

  const favoriteIcon = createHeartIcon('outline');
  favoriteIcon.classList.add('game-details-dialog__button-icon');

  const favoriteText = createElement('span', {
    className: 'game-details-dialog__button-text',
    text: 'Add to Favorites',
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
    favoriteButton.classList.toggle(
      'game-details-dialog__button--favorite-active',
      isFavoriteActive,
    );
  }

  const actions = createElement('div', {
    className: 'game-details-dialog__actions',
    children: [playButton, favoriteButton],
  });

  const section = createElement('section', {
    className: 'game-details-dialog__info',
    attributes: { 'aria-labelledby': 'game-details-title' },
    children: [headerRow, description, specsList, actions],
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
