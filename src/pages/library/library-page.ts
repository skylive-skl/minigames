import { getRouteState, updateQuery } from '@/app/router';
import type { PageComponent } from '@/app/routes';
import { createFooter } from '@/components/footer/footer';
import { fetchGames } from '@/shared/api/games-api';
import { isAbortError } from '@/shared/api/http';
import { createElement } from '@/shared/lib/dom';
import { showSnackbar } from '@/shared/ui/snackbar/snackbar';
import { createLibraryFilter } from './components/library-filter/library-filter';
import { createLibraryGrid } from './components/library-grid/library-grid';
import { createLibraryPagination } from './components/library-pagination/library-pagination';
import {
  LIBRARY_QUERY_KEYS,
  parseLibraryQuery,
  toLibraryQueryPatch,
  type LibraryQuery,
} from './library-query';
import './library-page.scss';

function isSameQuery(a: LibraryQuery, b: LibraryQuery): boolean {
  return (
    a.category === b.category && a.sort === b.sort && a.page === b.page && a.isValid === b.isValid
  );
}

// The URL is the single source of truth: controls only update the query
// string, and every games request is derived from the parsed URL.
export function createLibraryPage(): PageComponent {
  let query = parseLibraryQuery(getRouteState().params);
  let abortController: AbortController | undefined;

  // A new filter or sort order always starts from the first page.
  const resetPagePatch = { [LIBRARY_QUERY_KEYS.page]: undefined };

  const filter = createLibraryFilter({
    initialSort: query.sort,
    onCategoryChange: (category) => {
      updateQuery({ ...toLibraryQueryPatch({ category }), ...resetPagePatch });
    },
    onSortChange: (sort) => {
      updateQuery({ ...toLibraryQueryPatch({ sort }), ...resetPagePatch });
    },
  });
  filter.setActiveCategory(getRouteState().params.get(LIBRARY_QUERY_KEYS.category) ?? undefined);
  const grid = createLibraryGrid();
  const pagination = createLibraryPagination({
    onPageChange: (page) => {
      updateQuery(toLibraryQueryPatch({ page }));
      grid.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
  });
  const footer = createFooter();

  const content = createElement('div', {
    className: 'library-page__content',
    children: [filter.element, grid.element, pagination.element],
  });

  const element = createElement('div', {
    className: 'library-page',
    children: [content, footer.element],
  });

  function showNotFound(): void {
    grid.showNotFound();
    pagination.update({ page: 1, totalPages: 0 });
  }

  async function loadGames(): Promise<void> {
    abortController?.abort();

    if (!query.isValid) {
      showNotFound();
      return;
    }

    const controller = new AbortController();
    abortController = controller;
    grid.showLoading();

    try {
      const response = await fetchGames(query, controller.signal);

      if (response.data.length === 0) {
        showNotFound();
        return;
      }

      grid.showGames(response.data);
      pagination.update({ page: response.meta.page, totalPages: response.meta.totalPages });
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }
      grid.showError(error instanceof Error ? error.message : 'Unknown error', () => {
        void loadGames();
      });
      showSnackbar({ message: 'Failed to load games.', variant: 'error' });
    }
  }

  void loadGames();

  return {
    element,
    onQueryChange: (parameters: URLSearchParams): void => {
      const nextQuery = parseLibraryQuery(parameters);

      // Dialog params (e.g. ?game=) also change the query; ignore them here.
      if (isSameQuery(query, nextQuery)) {
        return;
      }

      query = nextQuery;
      filter.setActiveCategory(parameters.get(LIBRARY_QUERY_KEYS.category) ?? undefined);
      filter.setActiveSort(query.sort);
      void loadGames();
    },
    destroy: (): void => {
      abortController?.abort();
      filter.destroy?.();
      grid.destroy?.();
      pagination.destroy?.();
      footer.destroy?.();
    },
  };
}
