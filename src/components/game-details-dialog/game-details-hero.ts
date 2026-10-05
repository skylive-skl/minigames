import { createElement } from '@/shared/lib/dom';
import { getGameImageUrl } from '@/shared/lib/game-images';
import type { GameDetails } from '@/shared/types/game';
import { createSkeleton } from '@/shared/ui/skeleton/skeleton';

export interface GameDetailsHeroOptions {
  readonly closeButton: HTMLButtonElement;
}

export interface GameDetailsHeroController {
  readonly element: HTMLElement;
  readonly update: (game: GameDetails) => void;
  readonly showLoading: () => void;
  readonly clear: () => void;
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

  const skeleton = createSkeleton({ className: 'game-details-dialog__hero-skeleton' });
  skeleton.hidden = true;

  const element = createElement('header', {
    className: 'game-details-dialog__hero',
    children: [image, skeleton, options.closeButton],
  });

  function setImageVisible(isVisible: boolean): void {
    image.hidden = !isVisible;
    skeleton.hidden = true;
  }

  return {
    element,
    update: (game: GameDetails): void => {
      image.src = getGameImageUrl(game.slug, 'hero');
      image.alt = game.name;
      setImageVisible(true);
    },
    showLoading: (): void => {
      setImageVisible(false);
      skeleton.hidden = false;
    },
    clear: (): void => {
      image.removeAttribute('src');
      image.alt = '';
      setImageVisible(false);
    },
  };
}
