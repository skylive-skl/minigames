import { createHomePage } from '@/pages/home/home-page';
import { createLibraryPage } from '@/pages/library/library-page';
import { createNotFoundPage } from '@/pages/not-found/not-found-page';
import type { Component } from '@/shared/types/component';

export type RouteName = 'home' | 'library' | 'not-found';

// Any path missing from ROUTE_PATHS renders the 404 page.
export const FALLBACK_ROUTE: RouteName = 'not-found';

// A page that stays mounted while only the query string changes
// (e.g. Library filters) reacts through onQueryChange instead of re-rendering.
export interface PageComponent extends Component {
  onQueryChange?(parameters: URLSearchParams): void;
}

// Keys are app paths without the base URL and without slashes.
export const ROUTE_PATHS: Readonly<Record<string, RouteName>> = {
  '': 'home',
  home: 'home',
  library: 'library',
};

export const routes: Readonly<Record<RouteName, () => PageComponent>> = {
  home: createHomePage,
  library: createLibraryPage,
  'not-found': createNotFoundPage,
};
