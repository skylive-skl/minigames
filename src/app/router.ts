import { BASE_PATH, buildHref } from './paths';
import { FALLBACK_ROUTE, ROUTE_PATHS, routes, type PageComponent, type RouteName } from './routes';

const LOCATION_CHANGE_EVENT = 'minigames:location-change';
const LEGACY_HASH_PREFIX = '#/';
const EDGE_SLASHES_PATTERN = /^\/+|\/+$/gu;

export interface RouteState {
  readonly name: RouteName;
  readonly path: string;
  readonly params: URLSearchParams;
}

// An undefined value removes the key from the URL.
export type QueryPatch = Readonly<Record<string, string | number | undefined>>;

export interface NavigateOptions {
  readonly replace?: boolean;
  readonly state?: unknown;
}

function normalizePath(path: string): string {
  return path.replaceAll(EDGE_SLASHES_PATTERN, '').toLowerCase();
}

function stripBasePath(pathname: string): string {
  const baseWithoutTrailingSlash = BASE_PATH.replace(/\/$/u, '');

  if (pathname === baseWithoutTrailingSlash) {
    return '';
  }

  return pathname.startsWith(BASE_PATH) ? pathname.slice(BASE_PATH.length) : pathname;
}

export function resolveRoute(path: string): RouteName {
  const key = normalizePath(path);
  return Object.hasOwn(ROUTE_PATHS, key) ? (ROUTE_PATHS[key] ?? FALLBACK_ROUTE) : FALLBACK_ROUTE;
}

export function getRouteState(): RouteState {
  const path = normalizePath(stripBasePath(globalThis.location.pathname));

  return {
    name: resolveRoute(path),
    path,
    params: new URLSearchParams(globalThis.location.search),
  };
}

export function getCurrentRoute(): RouteName {
  return getRouteState().name;
}

export function navigate(to: string, options: NavigateOptions = {}): void {
  const href = buildHref(to);
  const currentHref = `${globalThis.location.pathname}${globalThis.location.search}`;

  if (href === currentHref && options.replace !== true) {
    return;
  }

  if (options.replace === true) {
    globalThis.history.replaceState(options.state, '', href);
  } else {
    globalThis.history.pushState(options.state, '', href);
  }

  globalThis.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
}

export function updateQuery(patch: QueryPatch, options: NavigateOptions = {}): void {
  const { path, params } = getRouteState();

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  }

  const query = params.toString();
  navigate(query === '' ? `/${path}` : `/${path}?${query}`, options);
}

export type RouteChangeListener = (state: RouteState) => void;

const routeListeners = new Set<RouteChangeListener>();

export function onRouteChange(listener: RouteChangeListener): () => void {
  routeListeners.add(listener);
  return () => {
    routeListeners.delete(listener);
  };
}

function notifyRouteChange(state: RouteState): void {
  for (const listener of routeListeners) {
    listener(state);
  }
}

// Converts a same-origin link into an app path; legacy "#/library" links
// from older builds are still understood.
function getAppPathFromUrl(url: URL): string | undefined {
  if (url.origin !== globalThis.location.origin) {
    return undefined;
  }

  if (url.hash.startsWith(LEGACY_HASH_PREFIX)) {
    return `/${url.hash.slice(LEGACY_HASH_PREFIX.length)}`;
  }

  const isInsideApp = `${url.pathname}/`.startsWith(BASE_PATH);
  return isInsideApp ? `/${stripBasePath(url.pathname)}${url.search}` : undefined;
}

function isModifiedClick(event: MouseEvent): boolean {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function handleDocumentClick(event: MouseEvent): void {
  if (event.defaultPrevented || isModifiedClick(event) || !(event.target instanceof Element)) {
    return;
  }

  const anchor = event.target.closest('a');

  if (
    anchor === null ||
    anchor.hasAttribute('download') ||
    (anchor.target !== '' && anchor.target !== '_self')
  ) {
    return;
  }

  const appPath = getAppPathFromUrl(new URL(anchor.href));

  if (appPath === undefined) {
    return;
  }

  event.preventDefault();
  navigate(appPath);
}

function redirectLegacyHashUrl(): void {
  const { hash } = globalThis.location;

  if (hash.startsWith(LEGACY_HASH_PREFIX)) {
    globalThis.history.replaceState(
      undefined,
      '',
      buildHref(`/${hash.slice(LEGACY_HASH_PREFIX.length)}`),
    );
  }
}

export interface Router {
  start(): void;
}

export function createRouter(outlet: HTMLElement): Router {
  let current: PageComponent | undefined;
  let currentPath: string | undefined;

  function render(): void {
    const state = getRouteState();

    // Same path = same page instance; only the query changed.
    if (current !== undefined && state.path === currentPath) {
      current.onQueryChange?.(state.params);
    } else {
      current?.destroy?.();
      current = routes[state.name]();
      currentPath = state.path;
      outlet.replaceChildren(current.element);
      globalThis.scrollTo({ top: 0 });
    }

    notifyRouteChange(state);
  }

  function start(): void {
    redirectLegacyHashUrl();
    globalThis.addEventListener('popstate', render);
    globalThis.addEventListener(LOCATION_CHANGE_EVENT, render);
    document.addEventListener('click', handleDocumentClick);
    render();
  }

  return { start };
}
