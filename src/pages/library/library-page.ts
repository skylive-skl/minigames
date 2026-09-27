import { createFooter } from '@/components/footer/footer';
import { createElement } from '@/shared/lib/dom';
import type { Component } from '@/shared/types/component';
import { createLibraryFilter } from './components/library-filter/library-filter';
import { createLibraryGrid } from './components/library-grid/library-grid';
import './library-page.scss';

export function createLibraryPage(): Component {
  const filter = createLibraryFilter();
  const grid = createLibraryGrid();
  const footer = createFooter();

  const content = createElement('div', {
    className: 'library-page__content',
    children: [filter.element, grid.element],
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
      footer.destroy?.();
    },
  };
}
