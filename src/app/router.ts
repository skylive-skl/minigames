import type { Component } from '@/shared/types/component';
import { DEFAULT_ROUTE, routes, type RouteName } from './routes';

const HASH_PREFIX_PATTERN = /^#\/?/u;

export function resolveRoute(hash: string): RouteName {
  const name = hash.replace(HASH_PREFIX_PATTERN, '').trim().toLowerCase();
  return Object.hasOwn(routes, name) ? (name as RouteName) : DEFAULT_ROUTE;
}

export function getCurrentRoute(): RouteName {
  return resolveRoute(globalThis.location.hash);
}

export type RouteChangeListener = (route: RouteName) => void;

const routeListeners = new Set<RouteChangeListener>();

export function onRouteChange(listener: RouteChangeListener): () => void {
  routeListeners.add(listener);
  return () => {
    routeListeners.delete(listener);
  };
}

function notifyRouteChange(route: RouteName): void {
  for (const listener of routeListeners) {
    listener(route);
  }
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
    notifyRouteChange(routeName);
  }

  function start(): void {
    globalThis.addEventListener('hashchange', render);
    render();
  }

  return { start };
}
