import { createElement } from '@/shared/lib/dom';
import type { Component } from '@/shared/types/component';
import './home-page.scss';

export function createHomePage(): Component {
  const element = createElement('div', { className: 'home-page', text: 'home-page' });

  return { element };
}
