import { createFooter } from '@/components/footer/footer';
import { createElement } from '@/shared/lib/dom';
import type { Component } from '@/shared/types/component';
import './library-page.scss';

export function createLibraryPage(): Component {
  const footer = createFooter();
  const content = createElement('div', {
    className: 'library-page__content',
  });
  const element = createElement('div', {
    className: 'library-page',
    children: [content, footer.element],
  });

  return { element };
}
