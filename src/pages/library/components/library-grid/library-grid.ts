import { games } from '@/data/games';
import { createElement } from '@/shared/lib/dom';
import type { Component } from '@/shared/types/component';
import type { Game } from '@/shared/types/game';
import { createLibraryCard } from './library-card';
import './library-grid.scss';

export const LIBRARY_GAMES_PER_PAGE = 6;

export interface LibraryGridOptions {
  readonly gamesList?: readonly Game[];
}

export function createLibraryGrid(options?: LibraryGridOptions): Component {
  const displayGames = options?.gamesList ?? games.slice(0, LIBRARY_GAMES_PER_PAGE);

  const items = displayGames.map((game) => {
    const card = createLibraryCard(game);
    return createElement('li', {
      className: 'library-grid__item',
      children: [card],
    });
  });

  const list = createElement('ul', {
    className: 'library-grid__list',
    children: items,
  });

  const element = createElement('section', {
    className: 'library-grid',
    attributes: { 'aria-label': 'Games catalog' },
    children: [list],
  });

  return { element };
}
