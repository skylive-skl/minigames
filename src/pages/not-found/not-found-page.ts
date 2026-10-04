import { navigate } from '@/app/router';
import { createFooter } from '@/components/footer/footer';
import { createElement } from '@/shared/lib/dom';
import type { Component } from '@/shared/types/component';
import './not-found-page.scss';

export function createNotFoundPage(): Component {
  const code = createElement('p', {
    className: 'not-found-page__code',
    attributes: { 'aria-hidden': 'true' },
    text: '404',
  });

  const title = createElement('h1', {
    className: 'not-found-page__title',
    attributes: { id: 'not-found-title' },
    text: 'Page not found',
  });

  const requestedPath = createElement('code', {
    className: 'not-found-page__path',
    text: globalThis.location.pathname,
  });

  const message = createElement('p', {
    className: 'not-found-page__message',
    children: [
      document.createTextNode('The page '),
      requestedPath,
      document.createTextNode(' does not exist or has been moved.'),
    ],
  });

  const homeButton = createElement('button', {
    className: 'not-found-page__button',
    attributes: { type: 'button' },
    text: 'Return to Home Page',
    onClick: () => {
      navigate('/');
    },
  });

  const content = createElement('section', {
    className: 'not-found-page__content',
    attributes: { 'aria-labelledby': 'not-found-title' },
    children: [code, title, message, homeButton],
  });

  const footer = createFooter();

  const element = createElement('div', {
    className: 'not-found-page',
    children: [content, footer.element],
  });

  return {
    element,
    destroy: (): void => {
      footer.destroy?.();
    },
  };
}
