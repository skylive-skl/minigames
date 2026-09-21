import { createElement } from '@/shared/lib/dom';
import type { Component } from '@/shared/types/component';
import { createArrowIcon } from '@/shared/ui/icon/icon';
import './carousel.scss';

function createArrowButton(direction: 'left' | 'right'): HTMLButtonElement {
  return createElement('button', {
    className: `carousel__arrow carousel__arrow--${direction}`,
    attributes: {
      type: 'button',
      'aria-label': direction === 'left' ? 'Previous slide' : 'Next slide',
      disabled: 'true',
    },
    children: [createArrowIcon(direction)],
  });
}

export function createCarousel(): Component {
  const heading = createElement('h2', { className: 'carousel__heading', text: 'New Games' });
  const accent = createElement('span', {
    className: 'carousel__accent',
    attributes: { 'aria-hidden': 'true' },
  });
  const titleGroup = createElement('div', {
    className: 'carousel__title-group',
    children: [accent, heading],
  });

  const arrows = createElement('div', {
    className: 'carousel__arrows',
    children: [createArrowButton('left'), createArrowButton('right')],
  });

  const header = createElement('div', {
    className: 'carousel__header',
    children: [titleGroup, arrows],
  });

  const track = createElement('ul', { className: 'carousel__track' });
  const trackViewport = createElement('div', {
    className: 'carousel__viewport',
    children: [track],
  });

  const element = createElement('section', {
    className: 'carousel',
    attributes: { 'aria-label': 'New Games' },
    children: [header, trackViewport],
  });

  return { element };
}
