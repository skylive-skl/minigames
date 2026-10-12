import { describe, expect, it, vi } from 'vitest';
import { createNotFoundPage } from './not-found-page';

const BASE = import.meta.env.BASE_URL;

describe('not found page', () => {
  it('names the requested path as text', () => {
    globalThis.history.replaceState(undefined, '', `${BASE}page/<abc>`);

    const page = createNotFoundPage();

    expect(page.element.querySelector('h1')?.textContent).toBe('Page not found');
    expect(page.element.querySelector('.not-found-page__path')?.textContent).toBe(
      `${BASE}page/%3Cabc%3E`,
    );
  });

  it('returns home through the SPA router without a reload', () => {
    globalThis.history.replaceState(undefined, '', `${BASE}unknown`);
    const locationChange = vi.fn();
    globalThis.addEventListener('minigames:location-change', locationChange);
    const page = createNotFoundPage();

    page.element.querySelector<HTMLButtonElement>('.not-found-page__button')?.click();

    expect(globalThis.location.pathname).toBe(BASE);
    expect(locationChange).toHaveBeenCalledOnce();
    globalThis.removeEventListener('minigames:location-change', locationChange);
  });

  it('links the footer navigation to the app routes', () => {
    const page = createNotFoundPage();
    const libraryLink = [...page.element.querySelectorAll('a')].find(
      (link) => link.textContent === 'Library',
    );

    expect(libraryLink?.getAttribute('href')).toBe(`${BASE}library`);
  });
});
