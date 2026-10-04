import { createElement } from '@/shared/lib/dom';
import { formatCompactNumber } from '@/shared/lib/format';
import type { GameDetails } from '@/shared/types/game';
import { createHeartIcon, createStarIcon } from '@/shared/ui/icon/icon';

export interface GameDetailsInfoController {
  readonly element: HTMLElement;
  readonly update: (game: GameDetails) => void;
  readonly isFavorite: () => boolean;
  readonly resetFavorite: () => void;
}

type SpecKey = keyof GameDetails['specs'];

const SPEC_LABELS: Readonly<Record<SpecKey, string>> = {
  genre: 'Genre',
  players: 'Players',
  duration: 'Duration',
  price: 'Price',
};

const SPEC_KEYS: readonly SpecKey[] = ['genre', 'players', 'duration', 'price'];

export function createGameDetailsInfo(): GameDetailsInfoController {
  let isFavoriteActive = false;
  let isInitiallyFavorite = false;

  const title = createElement('h2', {
    className: 'game-details-dialog__game-title',
    attributes: {
      id: 'game-details-title',
    },
  });

  const starIcon = createStarIcon('outline');
  starIcon.classList.add('game-details-dialog__stat-icon', 'game-details-dialog__stat-icon--star');

  const ratingValue = createElement('span', { className: 'game-details-dialog__stat-value' });
  const ratingStat = createElement('div', {
    className: 'game-details-dialog__stat',
    children: [starIcon, ratingValue],
  });

  const heartIcon = createHeartIcon('outline');
  heartIcon.classList.add(
    'game-details-dialog__stat-icon',
    'game-details-dialog__stat-icon--likes',
  );

  const likesValue = createElement('span', { className: 'game-details-dialog__stat-value' });
  const likesStat = createElement('div', {
    className: 'game-details-dialog__stat',
    children: [heartIcon, likesValue],
  });

  const stats = createElement('div', {
    className: 'game-details-dialog__stats',
    children: [ratingStat, likesStat],
  });

  const headerRow = createElement('div', {
    className: 'game-details-dialog__info-header',
    children: [title, stats],
  });

  const description = createElement('p', { className: 'game-details-dialog__description' });

  const specValues = new Map<SpecKey, HTMLElement>();

  const specsList = createElement('dl', {
    className: 'game-details-dialog__specs',
    children: SPEC_KEYS.map((key) => {
      const value = createElement('dd', { className: 'game-details-dialog__spec-value' });
      specValues.set(key, value);

      return createElement('div', {
        className: 'game-details-dialog__spec',
        children: [
          createElement('dt', {
            className: 'game-details-dialog__spec-label',
            text: SPEC_LABELS[key],
          }),
          value,
        ],
      });
    }),
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
    className: 'game-details-dialog__button game-details-dialog__button--favorite',
    attributes: {
      type: 'button',
      'aria-pressed': 'false',
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
    update: (game: GameDetails): void => {
      title.textContent = game.name;
      ratingValue.textContent = game.rating.toFixed(1);
      likesValue.textContent = formatCompactNumber(game.likesCount);
      description.textContent = game.fullDescription;
      for (const key of SPEC_KEYS) {
        const value = specValues.get(key);
        if (value !== undefined) {
          value.textContent = game.specs[key];
        }
      }
      isInitiallyFavorite = game.isLikedByCurrentUser;
      isFavoriteActive = isInitiallyFavorite;
      updateFavoriteState();
    },
    isFavorite: (): boolean => isFavoriteActive,
    resetFavorite: (): void => {
      isFavoriteActive = isInitiallyFavorite;
      updateFavoriteState();
    },
  };
}
