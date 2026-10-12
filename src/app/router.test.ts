import { describe, expect, it, vi } from 'vitest';
import type { PageComponent } from './routes';
import {
  createRouter,
  getRouteState,
  navigate,
  onBeforeRouteChange,
  onRouteChange,
  resolveRoute,
  updateQuery,
} from './router';

const { createStubPage } = vi.hoisted(() => ({
  createStubPage: (): PageComponent => ({ element: document.createElement('section') }),
}));

vi.mock('./routes', async (importOriginal) => {
  const original = await importOriginal<typeof import('./routes')>();
  return {
    ...original,
    routes: { home: createStubPage, library: createStubPage, 'not-found': createStubPage },
  };
});

const BASE = import.meta.env.BASE_URL;

describe('resolveRoute', () => {
  it.each([
    ['', 'home'],
    ['/', 'home'],
    ['home', 'home'],
    ['/library/', 'library'],
    ['LIBRARY', 'library'],
    ['unknown', 'not-found'],
    ['page/abc', 'not-found'],
    ['constructor', 'not-found'],
  ])('resolves "%s" to %s', (path, expected) => {
    expect(resolveRoute(path)).toBe(expected);
  });
});

describe('getRouteState', () => {
  it('strips the base path and exposes query parameters', () => {
    globalThis.history.replaceState(undefined, '', `${BASE}library?page=2`);

    const state = getRouteState();

    expect(state.name).toBe('library');
    expect(state.path).toBe('library');
    expect(state.params.get('page')).toBe('2');
  });

  it('treats the base path without a trailing slash as home', () => {
    globalThis.history.replaceState(undefined, '', BASE.replace(/\/$/u, ''));

    expect(getRouteState().name).toBe('home');
  });
});

describe('navigate', () => {
  it('pushes a new history entry under the base path', () => {
    const lengthBefore = globalThis.history.length;

    navigate('/library?page=3');

    expect(globalThis.location.pathname).toBe(`${BASE}library`);
    expect(globalThis.location.search).toBe('?page=3');
    expect(globalThis.history.length).toBe(lengthBefore + 1);
  });

  it('replaces the current entry and stores the given state', () => {
    const lengthBefore = globalThis.history.length;

    navigate('/library', { replace: true, state: { marker: 1 } });

    expect(globalThis.history.length).toBe(lengthBefore);
    expect(globalThis.history.state).toEqual({ marker: 1 });
  });

  it('skips pushing a duplicate entry for the current URL', () => {
    navigate('/library');
    const lengthBefore = globalThis.history.length;

    navigate('/library');

    expect(globalThis.history.length).toBe(lengthBefore);
  });
});

describe('updateQuery', () => {
  it('sets, overrides and removes keys while keeping the path', () => {
    globalThis.history.replaceState(undefined, '', `${BASE}library?category=card&page=4`);

    updateQuery({ category: 'puzzle', page: undefined, sort: 'name-asc' });

    expect(globalThis.location.pathname).toBe(`${BASE}library`);
    const parameters = new URLSearchParams(globalThis.location.search);
    expect(parameters.get('category')).toBe('puzzle');
    expect(parameters.get('sort')).toBe('name-asc');
    expect(parameters.has('page')).toBe(false);
  });

  it('keeps the URL hash when the query changes', () => {
    globalThis.history.replaceState(undefined, '', `${BASE}library?auth=login&page=2#games`);

    updateQuery({ auth: undefined }, { replace: true });

    expect(globalThis.location.pathname).toBe(`${BASE}library`);
    expect(globalThis.location.search).toBe('?page=2');
    expect(globalThis.location.hash).toBe('#games');
  });

  it('does not carry a legacy "#/route" hash into the new URL', () => {
    globalThis.history.replaceState(undefined, '', `${BASE}library#/library`);

    updateQuery({ page: 2 });

    expect(globalThis.location.hash).toBe('');
  });

  it('drops the question mark when no keys remain', () => {
    globalThis.history.replaceState(undefined, '', `${BASE}library?game=tiny-glade`);

    updateQuery({ game: undefined });

    expect(globalThis.location.search).toBe('');
  });
});

describe('route change hooks', () => {
  it('runs before-route listeners ahead of route listeners on every render', () => {
    const calls: string[] = [];
    const stopBefore = onBeforeRouteChange(() => {
      calls.push('before');
    });
    const stopAfter = onRouteChange((state) => {
      calls.push(`route:${state.name}`);
    });
    createRouter(document.createElement('main')).start();

    navigate('/library');

    expect(calls).toEqual(['before', 'route:home', 'before', 'route:library']);
    stopBefore();
    stopAfter();
  });

  it('stops calling a before-route listener after unsubscribe', () => {
    const listener = vi.fn();
    onBeforeRouteChange(listener)();
    createRouter(document.createElement('main')).start();

    navigate('/library');

    expect(listener).not.toHaveBeenCalled();
  });
});
