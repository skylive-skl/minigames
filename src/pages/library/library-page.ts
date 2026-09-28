import { createFooter } from '@/components/footer/footer';
import { games } from '@/data/games';
import { createElement } from '@/shared/lib/dom';
import type { Component } from '@/shared/types/component';
import { createLibraryFilter } from './components/library-filter/library-filter';
import { createLibraryGrid, LIBRARY_GAMES_PER_PAGE } from './components/library-grid/library-grid';
import { createLibraryPagination } from './components/library-pagination/library-pagination';
import './library-page.scss';

export function createLibraryPage(): Component {
  const totalPages = Math.ceil(games.length / LIBRARY_GAMES_PER_PAGE);

  const filter = createLibraryFilter();
  const grid = createLibraryGrid();
  const pagination = createLibraryPagination({
    initialPage: 1,
    totalPages,
    onPageChange: (page) => {
      grid.setPage(page);
      grid.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
  });
  const footer = createFooter();

  const content = createElement('div', {
    className: 'library-page__content',
    children: [filter.element, grid.element, pagination.element],
  });

  const element = createElement('div', {
    className: 'library-page',
    children: [content, footer.element],
  });

  return {
    element,
    destroy: (): void => {
      filter.destroy?.();
      grid.destroy?.();
      pagination.destroy?.();
      footer.destroy?.();
    },
  };
}
