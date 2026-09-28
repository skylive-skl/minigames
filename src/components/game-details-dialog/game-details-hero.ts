import tukoniHeroImageUrl from '@/assets/images/games/tukoni-forest-keepers-hero.jpg';
import { createElement } from '@/shared/lib/dom';

export interface GameDetailsHeroOptions {
  readonly title: string;
  readonly closeButton: HTMLButtonElement;
}

export function createGameDetailsHero(options: GameDetailsHeroOptions): HTMLElement {
  const image = createElement('img', {
    className: 'game-details-dialog__hero-image',
    attributes: {
      src: tukoniHeroImageUrl,
      alt: options.title,
      width: '600',
      height: '220',
      loading: 'eager',
    },
  });

  return createElement('header', {
    className: 'game-details-dialog__hero',
    children: [image, options.closeButton],
  });
}
