import { createHeader } from '@/components/header/header';
import { createElement } from '@/shared/lib/dom';
import { createRouter } from './router';

export function createApp(): HTMLElement {
  const header = createHeader();
  const outlet = createElement('main', { className: 'app-outlet' });
  const root = createElement('div', {
    attributes: { id: 'app' },
    children: [header.element, outlet],
  });

  createRouter(outlet).start();

  return root;
}
