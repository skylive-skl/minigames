import allGamesSeed from '@/shared/data/all-games-seed.json';
import { createElement } from '@/shared/lib/dom';
import type { Component } from '@/shared/types/component';
import type { Game } from '@/shared/types/game';
import { createArrowIcon } from '@/shared/ui/icon/icon';
import { createGameCard, type CardPosition } from './game-card';
import './carousel.scss';

const TRACK_SLUGS = [
  'vacation-cafe-simulator',
  'winter-burrow',
  'shelve-the-potions',
  'heartopia',
  'palia',
];
const TRACK_POSITIONS: readonly CardPosition[] = ['edge', 'side', 'center', 'side', 'edge'];

const games = allGamesSeed.data as Game[];

function getTrackGames(): Game[] {
  return TRACK_SLUGS.map((slug) => {
    const game = games.find((candidate) => candidate.slug === slug);

    if (game === undefined) {
      throw new Error(`Unknown game slug in carousel track: ${slug}`);
    }

    return game;
  });
}

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

  const items = getTrackGames().map((game, index) => {
    const position = TRACK_POSITIONS[index] ?? 'edge';

    return createElement('li', {
      className: 'carousel__item',
      children: [createGameCard(game, position)],
    });
  });

  const track = createElement('ul', { className: 'carousel__track', children: items });
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
