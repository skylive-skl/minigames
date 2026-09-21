import { createCarousel } from '@/components/carousel/carousel';
import { createHero } from '@/components/hero/hero';
import { createElement } from '@/shared/lib/dom';
import type { Component } from '@/shared/types/component';
import './home-page.scss';

export function createHomePage(): Component {
  const hero = createHero();
  const carousel = createCarousel();
  const element = createElement('div', {
    className: 'home-page',
    children: [hero.element, carousel.element],
  });

  return { element };
}
