import { createCarousel } from '@/components/carousel/carousel';
import { createDeveloperCta } from '@/components/developer-cta/developer-cta';
import { createHero } from '@/components/hero/hero';
import { createLeaderboard } from '@/components/leaderboard/leaderboard';
import { createElement } from '@/shared/lib/dom';
import type { Component } from '@/shared/types/component';
import './home-page.scss';

export function createHomePage(): Component {
  const hero = createHero();
  const carousel = createCarousel();
  const leaderboard = createLeaderboard();
  const developerCta = createDeveloperCta();
  const element = createElement('div', {
    className: 'home-page',
    children: [hero.element, carousel.element, leaderboard.element, developerCta.element],
  });

  return { element };
}
