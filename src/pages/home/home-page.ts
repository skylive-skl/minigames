import { createCarousel } from '@/components/carousel/carousel';
import { createDeveloperCta } from '@/components/developer-cta/developer-cta';
import { createFooter } from '@/components/footer/footer';
import { createHero } from '@/components/hero/hero';
import { createLeaderboard } from '@/components/leaderboard/leaderboard';
import allGamesSeed from '@/shared/data/all-games-seed.json';
import { createElement } from '@/shared/lib/dom';
import type { Component } from '@/shared/types/component';
import type { Game } from '@/shared/types/game';
import './home-page.scss';

export function createHomePage(): Component {
  const hero = createHero();
  const carousel = createCarousel();
  carousel.setGames((allGamesSeed.data as Game[]).filter((game) => game.featured));
  const leaderboard = createLeaderboard();
  const developerCta = createDeveloperCta();
  const footer = createFooter();
  const element = createElement('div', {
    className: 'home-page',
    children: [
      hero.element,
      carousel.element,
      leaderboard.element,
      developerCta.element,
      footer.element,
    ],
  });

  return {
    element,
    destroy: (): void => {
      carousel.destroy?.();
      leaderboard.destroy?.();
    },
  };
}
