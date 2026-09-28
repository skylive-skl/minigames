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

export interface LibraryGridComponent extends Component {
  readonly setPage: (page: number) => void;
}

export function createLibraryGrid(options?: LibraryGridOptions): LibraryGridComponent {
  const allGames = options?.gamesList ?? games;

  const list = createElement('ul', {
    className: 'library-grid__list',
  });

  const renderPage = (page: number): void => {
    const startIndex = (page - 1) * LIBRARY_GAMES_PER_PAGE;
    const pageGames = allGames.slice(startIndex, startIndex + LIBRARY_GAMES_PER_PAGE);

    const items = pageGames.map((game) => {
      const card = createLibraryCard(game);
      return createElement('li', {
        className: 'library-grid__item',
        children: [card],
      });
    });

    list.replaceChildren(...items);
  };

  renderPage(1);

  const element = createElement('section', {
    className: 'library-grid',
    attributes: { 'aria-label': 'Games catalog' },
    children: [list],
  });

  return {
    element,
    setPage: (page: number): void => {
      renderPage(page);
    },
  };
}
