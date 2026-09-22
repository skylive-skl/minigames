import { createHomePage } from '@/pages/home/home-page';
import type { Component } from '@/shared/types/component';

export type RouteName = 'home';

export const DEFAULT_ROUTE: RouteName = 'home';

export const routes: Readonly<Record<RouteName, () => Component>> = {
  home: createHomePage,
};
