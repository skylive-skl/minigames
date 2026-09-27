import { createFooter } from '@/components/footer/footer';
import { createElement } from '@/shared/lib/dom';
import type { Component } from '@/shared/types/component';
import { createLibraryFilter } from './components/library-filter/library-filter';
import './library-page.scss';

export function createLibraryPage(): Component {
  const filter = createLibraryFilter();
  const footer = createFooter();

  const content = createElement('div', {
    className: 'library-page__content',
    children: [filter.element],
  });

  const element = createElement('div', {
    className: 'library-page',
    children: [content, footer.element],
  });

  return {
    element,
    destroy: (): void => {
      filter.destroy?.();
      footer.destroy?.();
    },
  };
}
