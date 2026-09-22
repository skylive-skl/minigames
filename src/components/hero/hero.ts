import heroBackgroundUrl from '@/assets/images/hero-bg.jpg';
import { createElement } from '@/shared/lib/dom';
import type { Component } from '@/shared/types/component';
import './hero.scss';

const DESCRIPTION_DESKTOP =
  'Discover hundreds of curated casual mini-games. Play instantly in your browser — puzzle, match 3, farm, and board classics.';
const DESCRIPTION_MOBILE = 'Discover hundreds of curated casual mini-games right in your browser.';

export function createHero(): Component {
  const heading = createElement('h1', {
    className: 'hero__heading',
    text: 'Take a Short Break & Have Fun',
  });

  const descriptionDesktop = createElement('p', {
    className: 'hero__description hero__description--desktop',
    text: DESCRIPTION_DESKTOP,
  });

  const descriptionMobile = createElement('p', {
    className: 'hero__description hero__description--mobile',
    text: DESCRIPTION_MOBILE,
  });

  const button = createElement('button', {
    className: 'hero__button',
    text: 'Browse Library',
    attributes: { type: 'button' },
  });

  const card = createElement('div', {
    className: 'hero__card',
    children: [heading, descriptionDesktop, descriptionMobile, button],
  });

  const element = createElement('section', {
    className: 'hero',
    attributes: { 'aria-label': 'Hero' },
    children: [card],
  });
  element.style.backgroundImage = `url(${heroBackgroundUrl})`;

  return { element };
}
