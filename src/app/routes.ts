import { createHomePage } from '@/pages/home/home-page';
import { createLibraryPage } from '@/pages/library/library-page';
import type { Component } from '@/shared/types/component';

export type RouteName = 'home' | 'library';

export const DEFAULT_ROUTE: RouteName = 'home';

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
};
