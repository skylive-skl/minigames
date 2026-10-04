import type { QueryPatch } from '@/app/router';
import type { SortValue } from '@/shared/types/game';

export const LIBRARY_QUERY_KEYS = {
  category: 'category',
  sort: 'sort',
  page: 'page',
} as const;

export const DEFAULT_CATEGORY = 'all';
export const DEFAULT_SORT: SortValue = 'rating-desc';
export const DEFAULT_PAGE = 1;

export const SORT_VALUES: readonly SortValue[] = [
  'rating-desc',
  'rating-asc',
  'name-asc',
  'name-desc',
];

const CATEGORY_PATTERN = /^[a-z][a-z-]*$/u;
const PAGE_PATTERN = /^[1-9]\d*$/u;

export interface LibraryQuery {
  readonly category: string;
  readonly sort: SortValue;
  readonly page: number;
  // False when the URL holds a value the API cannot answer (e.g. page=abc);
  // the Library then shows "Data Not Found" instead of requesting games.
  readonly isValid: boolean;
}

export function isSortValue(value: string): value is SortValue {
  return (SORT_VALUES as readonly string[]).includes(value);
}

// Missing keys fall back to defaults; present-but-malformed keys mark the
// query invalid. Unknown category slugs are left to the API (400 response).
export function parseLibraryQuery(parameters: URLSearchParams): LibraryQuery {
  const rawCategory = parameters.get(LIBRARY_QUERY_KEYS.category);
  const rawSort = parameters.get(LIBRARY_QUERY_KEYS.sort);
  const rawPage = parameters.get(LIBRARY_QUERY_KEYS.page);

  const category = rawCategory ?? DEFAULT_CATEGORY;
  const isCategoryValid = CATEGORY_PATTERN.test(category);

  const isSortValid = rawSort === null || isSortValue(rawSort);
  const sort = rawSort !== null && isSortValue(rawSort) ? rawSort : DEFAULT_SORT;

  const isPageValid = rawPage === null || PAGE_PATTERN.test(rawPage);
  const page = rawPage !== null && isPageValid ? Number(rawPage) : DEFAULT_PAGE;

  return {
    category,
    sort,
    page,
    isValid: isCategoryValid && isSortValid && isPageValid,
  };
}

export function toLibraryQueryPatch(query: Partial<Omit<LibraryQuery, 'isValid'>>): QueryPatch {
  const patch: Record<string, string | number> = {};

  if (query.category !== undefined) {
    patch[LIBRARY_QUERY_KEYS.category] = query.category;
  }
  if (query.sort !== undefined) {
    patch[LIBRARY_QUERY_KEYS.sort] = query.sort;
  }
  if (query.page !== undefined) {
    patch[LIBRARY_QUERY_KEYS.page] = query.page;
  }

  return patch;
}
