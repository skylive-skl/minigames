import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchCategories } from '@/shared/api/categories-api';
import { fetchGames, type GamesListResponse } from '@/shared/api/games-api';
import { ApiError } from '@/shared/api/http';
import { GAME_DETAILS_DIALOG_OPEN_EVENT } from '@/shared/lib/app-events';
import { showSnackbar } from '@/shared/ui/snackbar/snackbar';
import { CATEGORIES, createGame } from '@/test/fixtures';
import { createLibraryPage } from './library-page';

vi.mock('@/shared/api/games-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api/games-api')>()),
  fetchGames: vi.fn(),
}));
vi.mock('@/shared/api/categories-api', () => ({ fetchCategories: vi.fn() }));
vi.mock('@/shared/ui/snackbar/snackbar', () => ({ showSnackbar: vi.fn() }));

const BASE = import.meta.env.BASE_URL;
// jsdom has no layout, so scrollIntoView does not exist.
const scrollIntoView = vi.fn();

function gamesResponse(
  games = [createGame(), createGame({ slug: 'cat-chess', name: 'Cat Chess', price: '$4.99' })],
  meta: Partial<GamesListResponse['meta']> = {},
): GamesListResponse {
  return {
    data: games,
    meta: {
      page: 1,
      limit: 6,
      totalItems: games.length,
      totalPages: 3,
      appliedFilter: { category: 'all', sort: 'rating-desc' },
      ...meta,
    },
  };
}

type LibraryPage = ReturnType<typeof createLibraryPage>;
const mountedPages: LibraryPage[] = [];

// The router is not running here: like it, re-feed URL changes to the page.
function syncUrl(page: LibraryPage): void {
  page.onQueryChange?.(new URLSearchParams(globalThis.location.search));
}

async function mountLibrary(url = 'library'): Promise<LibraryPage> {
  globalThis.history.replaceState(undefined, '', `${BASE}${url}`);
  const page = createLibraryPage();
  mountedPages.push(page);
  document.body.append(page.element);
  await vi.waitFor(() => {
    expect(page.element.querySelector('.library-grid')?.getAttribute('aria-busy')).not.toBe('true');
  });
  return page;
}

function cardTitles(page: LibraryPage): string[] {
  return [...page.element.querySelectorAll('.library-card__title')].map(
    (title) => title.textContent,
  );
}

function buttonByText(root: Element, text: string): HTMLButtonElement {
  const button = [...root.querySelectorAll('button')].find(
    (candidate) => candidate.textContent === text,
  );
  if (button === undefined) {
    throw new Error(`Button "${text}" is missing`);
  }
  return button;
}

function currentQuery(): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(globalThis.location.search));
}

describe('library page', () => {
  beforeEach(() => {
    vi.mocked(fetchGames).mockResolvedValue(gamesResponse());
    vi.mocked(fetchCategories).mockResolvedValue(CATEGORIES);
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  afterEach(() => {
    for (const page of mountedPages.splice(0)) {
      page.destroy?.();
    }
  });

  it('requests the first page with default filters and renders the cards', async () => {
    const page = await mountLibrary();

    expect(fetchGames).toHaveBeenCalledWith(
      { category: 'all', sort: 'rating-desc', page: 1, isValid: true },
      expect.any(AbortSignal),
    );
    expect(cardTitles(page)).toEqual(['Tiny Glade', 'Cat Chess']);
    expect(page.element.querySelector('.library-card__price--free')?.textContent).toBe('Free');
    expect(page.element.querySelector('.library-card__likes')?.textContent).toBe('28.7K');
  });

  it('builds the request from the URL on a deep link', async () => {
    const page = await mountLibrary('library?category=puzzle&sort=name-asc&page=2');

    expect(fetchGames).toHaveBeenCalledWith(
      { category: 'puzzle', sort: 'name-asc', page: 2, isValid: true },
      expect.any(AbortSignal),
    );
    await vi.waitFor(() => {
      expect(buttonByText(page.element, 'Puzzle').getAttribute('aria-selected')).toBe('true');
    });
    expect(page.element.querySelector('.library-filter__sort-label')?.textContent).toBe(
      'Sort by: Name A–Z',
    );
  });

  it('highlights the default category chip when the URL has none', async () => {
    const page = await mountLibrary();

    await vi.waitFor(() => {
      expect(buttonByText(page.element, 'All Games').getAttribute('aria-selected')).toBe('true');
    });
  });

  it('writes a new category to the URL, resets the page and refetches', async () => {
    const page = await mountLibrary('library?page=3');
    await vi.waitFor(() => buttonByText(page.element, 'Card'));

    buttonByText(page.element, 'Card').click();
    syncUrl(page);

    expect(currentQuery()).toEqual({ category: 'card' });
    expect(fetchGames).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: 'card', page: 1 }),
      expect.any(AbortSignal),
    );
  });

  it('writes a new sort order to the URL from the dropdown', async () => {
    const page = await mountLibrary('library?page=2');
    const sortButton = page.element.querySelector<HTMLButtonElement>('.library-filter__sort-btn');

    sortButton?.click();
    expect(sortButton?.getAttribute('aria-expanded')).toBe('true');
    [...page.element.querySelectorAll<HTMLElement>('[role="option"]')]
      .find((option) => option.textContent === 'Name Z–A')
      ?.click();
    syncUrl(page);

    expect(currentQuery()).toEqual({ sort: 'name-desc' });
    expect(sortButton?.getAttribute('aria-expanded')).toBe('false');
    expect(fetchGames).toHaveBeenLastCalledWith(
      expect.objectContaining({ sort: 'name-desc', page: 1 }),
      expect.any(AbortSignal),
    );
  });

  it('closes the sort menu on Escape and on an outside click', async () => {
    const page = await mountLibrary();
    const sortButton = page.element.querySelector<HTMLButtonElement>('.library-filter__sort-btn');

    sortButton?.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(sortButton?.getAttribute('aria-expanded')).toBe('false');

    sortButton?.click();
    document.body.click();
    expect(sortButton?.getAttribute('aria-expanded')).toBe('false');
  });

  it('moves to another page through the pagination and scrolls to the grid', async () => {
    const page = await mountLibrary();

    buttonByText(page.element, '2').click();
    syncUrl(page);

    expect(currentQuery()).toEqual({ page: '2' });
    expect(scrollIntoView).toHaveBeenCalled();
    expect(fetchGames).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 }),
      expect.any(AbortSignal),
    );
  });

  it('ignores query changes that only concern dialogs', async () => {
    const page = await mountLibrary();
    vi.mocked(fetchGames).mockClear();

    page.onQueryChange?.(new URLSearchParams('game=tiny-glade'));

    expect(fetchGames).not.toHaveBeenCalled();
  });

  it('opens game details from a card', async () => {
    const page = await mountLibrary();
    const listener = vi.fn();
    document.addEventListener(GAME_DETAILS_DIALOG_OPEN_EVENT, listener);

    buttonByText(page.element, 'Details').click();

    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: 'tiny-glade' }));
    document.removeEventListener(GAME_DETAILS_DIALOG_OPEN_EVENT, listener);
  });
});

function expectDataNotFound(page: LibraryPage): void {
  expect(page.element.textContent).toContain('Data Not Found');
  const pages = [...page.element.querySelectorAll('.library-pagination__page')];
  expect(pages.map((button) => button.textContent)).toEqual(['1']);
  for (const arrow of page.element.querySelectorAll<HTMLButtonElement>(
    '.library-pagination__arrow',
  )) {
    expect(arrow.disabled).toBe(true);
  }
}

describe('library empty and error states', () => {
  beforeEach(() => {
    vi.mocked(fetchCategories).mockResolvedValue(CATEGORIES);
  });

  afterEach(() => {
    for (const page of mountedPages.splice(0)) {
      page.destroy?.();
    }
  });

  it('shows Data Not Found for an empty page', async () => {
    vi.mocked(fetchGames).mockResolvedValue(gamesResponse([], { totalPages: 0 }));

    expectDataNotFound(await mountLibrary('library?page=99'));
  });

  it('does not call the API for a malformed page value', async () => {
    vi.mocked(fetchGames).mockResolvedValue(gamesResponse());

    const page = await mountLibrary('library?page=abc');

    expect(fetchGames).not.toHaveBeenCalled();
    expectDataNotFound(page);
  });

  it('treats an unknown category (400) as missing data, not a failure', async () => {
    vi.mocked(fetchGames).mockRejectedValue(new ApiError('Unknown category', 400));

    expectDataNotFound(await mountLibrary('library?category=bogus'));
    expect(showSnackbar).not.toHaveBeenCalled();
  });

  it('shows an error banner and Snackbar on a server failure, and retries', async () => {
    vi.mocked(fetchGames)
      .mockRejectedValueOnce(new ApiError('Server error', 500))
      .mockResolvedValue(gamesResponse());

    const page = await mountLibrary();

    expect(page.element.textContent).toContain('Could not load games');
    expect(showSnackbar).toHaveBeenCalledWith({
      message: 'Failed to load games.',
      variant: 'error',
    });

    buttonByText(page.element, 'Try again').click();

    await vi.waitFor(() => {
      expect(cardTitles(page)).toEqual(['Tiny Glade', 'Cat Chess']);
    });
  });

  it('shows a category error with retry when chips fail to load', async () => {
    vi.mocked(fetchGames).mockResolvedValue(gamesResponse());
    vi.mocked(fetchCategories)
      .mockRejectedValueOnce(new ApiError('Network error.', 0))
      .mockResolvedValue(CATEGORIES);

    const page = await mountLibrary();

    await vi.waitFor(() => {
      expect(page.element.textContent).toContain('Could not load categories');
    });
    buttonByText(page.element, 'Try again').click();

    await vi.waitFor(() => buttonByText(page.element, 'Puzzle'));
  });
});
