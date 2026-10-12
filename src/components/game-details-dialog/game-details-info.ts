import { createElement } from '@/shared/lib/dom';
import { formatCompactNumber } from '@/shared/lib/format';
import type { GameDetails } from '@/shared/types/game';
import { createHeartIcon, createStarIcon } from '@/shared/ui/icon/icon';
import { createSpinner } from '@/shared/ui/spinner/spinner';

export interface GameDetailsInfoController {
  readonly element: HTMLElement;
  readonly update: (game: GameDetails) => void;
  // Server-confirmed state only (details response or favorite POST).
  readonly setFavorite: (isFavorited: boolean, likesCount: number) => void;
  readonly setFavoritePending: (isPending: boolean) => void;
}

export interface GameDetailsInfoOptions {
  readonly onFavoriteClick?: () => void;
}

type SpecKey = keyof GameDetails['specs'];

const SPEC_LABELS: Readonly<Record<SpecKey, string>> = {
  genre: 'Genre',
  players: 'Players',
  duration: 'Duration',
  price: 'Price',
};

const SPEC_KEYS: readonly SpecKey[] = ['genre', 'players', 'duration', 'price'];

export function createGameDetailsInfo(
  options: GameDetailsInfoOptions = {},
): GameDetailsInfoController {
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
      options.onFavoriteClick?.();
    },
  });

  const favoriteSpinner = createSpinner('game-details-dialog__button-spinner');

  function setFavorite(isFavorited: boolean, likesCount: number): void {
    favoriteButton.setAttribute('aria-pressed', String(isFavorited));
    favoriteButton.classList.toggle('game-details-dialog__button--favorite-active', isFavorited);
    likesValue.textContent = formatCompactNumber(likesCount);
  }

  function setFavoritePending(isPending: boolean): void {
    favoriteButton.disabled = isPending;
    favoriteButton.setAttribute('aria-busy', String(isPending));
    favoriteButton.replaceChildren(isPending ? favoriteSpinner : favoriteIcon, favoriteText);
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
      description.textContent = game.fullDescription;
      for (const key of SPEC_KEYS) {
        const value = specValues.get(key);
        if (value !== undefined) {
          value.textContent = game.specs[key];
        }
      }
      // isLikedByCurrentUser is the favorite flag (false for guests).
      setFavorite(game.isLikedByCurrentUser, game.likesCount);
      setFavoritePending(false);
    },
    setFavorite,
    setFavoritePending,
  };
}
