import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CATEGORY,
  DEFAULT_PAGE,
  DEFAULT_SORT,
  isSortValue,
  parseLibraryQuery,
  toLibraryQueryPatch,
} from './library-query';

const parse = (query: string): ReturnType<typeof parseLibraryQuery> =>
  parseLibraryQuery(new URLSearchParams(query));

describe('parseLibraryQuery', () => {
  it('falls back to defaults when the URL has no library keys', () => {
    expect(parse('')).toEqual({
      category: DEFAULT_CATEGORY,
      sort: DEFAULT_SORT,
      page: DEFAULT_PAGE,
      isValid: true,
    });
  });

  it('reads category, sort and page from the URL', () => {
    expect(parse('category=puzzle&sort=name-asc&page=3')).toEqual({
      category: 'puzzle',
      sort: 'name-asc',
      page: 3,
      isValid: true,
    });
  });

  it('keeps unknown but well-formed categories for the API to reject', () => {
    expect(parse('category=bogus')).toMatchObject({ category: 'bogus', isValid: true });
  });

  it.each(['category=Puzzle', 'category=123', 'category='])(
    'marks malformed category "%s" as invalid',
    (query) => {
      expect(parse(query).isValid).toBe(false);
    },
  );

  it('marks an unknown sort as invalid and uses the default sort', () => {
    expect(parse('sort=bogus')).toMatchObject({ sort: DEFAULT_SORT, isValid: false });
  });

  it.each(['page=0', 'page=-1', 'page=abc', 'page=1.5', 'page=01'])(
    'marks "%s" as invalid and falls back to page 1',
    (query) => {
      expect(parse(query)).toMatchObject({ page: DEFAULT_PAGE, isValid: false });
    },
  );
});

describe('isSortValue', () => {
  it('accepts only API sort values', () => {
    expect(isSortValue('rating-asc')).toBe(true);
    expect(isSortValue('rating')).toBe(false);
  });
});

describe('toLibraryQueryPatch', () => {
  it('maps only provided fields to URL keys', () => {
    expect(toLibraryQueryPatch({ category: 'card', page: 2 })).toEqual({
      category: 'card',
      page: 2,
    });
    expect(toLibraryQueryPatch({ sort: 'name-desc' })).toEqual({ sort: 'name-desc' });
    expect(toLibraryQueryPatch({})).toEqual({});
  });
});
