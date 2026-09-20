import type { Component } from '@/shared/types/component';
import { DEFAULT_ROUTE, routes, type RouteName } from './routes';

const HASH_PREFIX_PATTERN = /^#\/?/u;

function resolveRoute(hash: string): RouteName {
  const name = hash.replace(HASH_PREFIX_PATTERN, '');
  return Object.hasOwn(routes, name) ? (name as RouteName) : DEFAULT_ROUTE;
}

export interface Router {
  start(): void;
}

export function createRouter(outlet: HTMLElement): Router {
  let current: Component | undefined;

  function render(): void {
    const routeName = resolveRoute(globalThis.location.hash);
    const factory = routes[routeName];

    current?.destroy?.();
    outlet.replaceChildren();

    current = factory();
    outlet.append(current.element);
  }

  function start(): void {
    globalThis.addEventListener('hashchange', render);
    render();
  }

  return { start };
}
