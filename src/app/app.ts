import { createElement } from '@/shared/lib/dom';
import { createRouter } from './router';

export function createApp(): HTMLElement {
  const outlet = createElement('main', { className: 'app-outlet' });
  const root = createElement('div', {
    attributes: { id: 'app' },
    children: [outlet],
  });

  createRouter(outlet).start();

  return root;
}
