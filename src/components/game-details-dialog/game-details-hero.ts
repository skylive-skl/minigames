import { createElement } from '@/shared/lib/dom';
import { getGameImageUrl } from '@/shared/lib/game-images';
import type { GameDetails } from '@/shared/types/game';

export interface GameDetailsHeroOptions {
  readonly closeButton: HTMLButtonElement;
}

export interface GameDetailsHeroController {
  readonly element: HTMLElement;
  readonly update: (game: GameDetails) => void;
}

export function createGameDetailsHero(options: GameDetailsHeroOptions): GameDetailsHeroController {
  const image = createElement('img', {
    className: 'game-details-dialog__hero-image',
    attributes: {
      alt: '',
      width: '600',
      height: '220',
      loading: 'eager',
    },
  });

  const element = createElement('header', {
    className: 'game-details-dialog__hero',
    children: [image, options.closeButton],
  });

  return {
    element,
    update: (game: GameDetails): void => {
      image.src = getGameImageUrl(game.slug, 'hero');
      image.alt = game.name;
    },
  };
}
