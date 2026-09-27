import { createHomePage } from '@/pages/home/home-page';
import { createLibraryPage } from '@/pages/library/library-page';
import type { Component } from '@/shared/types/component';

export type RouteName = 'home' | 'library';

export const DEFAULT_ROUTE: RouteName = 'home';

export const routes: Readonly<Record<RouteName, () => Component>> = {
  home: createHomePage,
  library: createLibraryPage,
};
