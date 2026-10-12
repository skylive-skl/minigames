import { describe, expect, it, vi } from 'vitest';
import { fetchLatestComments, postComment, toggleCommentLike } from './comments-api';
import { fetchFeaturedGames, fetchGameDetails, fetchGames, toggleFavorite } from './games-api';
import { API_BASE_URL } from './http';

function mockFetch(body: unknown): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(() => Promise.resolve(Response.json(body)));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function requestOf(fetchMock: ReturnType<typeof vi.fn>): { url: URL; init: RequestInit } {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  return { url: new URL(url), init };
}

describe('games api', () => {
  it('loads featured games', async () => {
    const fetchMock = mockFetch({ data: [{ slug: 'a' }] });

    await expect(fetchFeaturedGames()).resolves.toEqual([{ slug: 'a' }]);
    expect(requestOf(fetchMock).url.searchParams.get('featured')).toBe('true');
  });

  it('sends library filters, sort, page and page size', async () => {
    const fetchMock = mockFetch({ data: [], meta: {} });

    await fetchGames({ category: 'puzzle', sort: 'name-asc', page: 3 });

    const { searchParams } = requestOf(fetchMock).url;
    expect(Object.fromEntries(searchParams)).toEqual({
      category: 'puzzle',
      sort: 'name-asc',
      page: '3',
      limit: '6',
    });
  });

  it('loads guest game details without userEmail', async () => {
    const fetchMock = mockFetch({ data: { slug: 'tiny-glade' } });

    await expect(fetchGameDetails('tiny-glade')).resolves.toEqual({ slug: 'tiny-glade' });

    const { url } = requestOf(fetchMock);
    expect(url.pathname).toBe(`${new URL(API_BASE_URL).pathname}/games/tiny-glade`);
    expect(url.searchParams.has('userEmail')).toBe(false);
  });

  it('personalizes game details with an encoded userEmail', async () => {
    const fetchMock = mockFetch({ data: {} });

    await fetchGameDetails('tiny glade', { userEmail: 'alex+test@mail.com' });

    const { url } = requestOf(fetchMock);
    expect(url.pathname.endsWith('/games/tiny%20glade')).toBe(true);
    expect(url.search).toBe('?userEmail=alex%2Btest%40mail.com');
  });

  it('toggles a favorite with the user email in the body', async () => {
    const fetchMock = mockFetch({
      data: { gameSlug: 'tiny-glade', isFavorited: true, likesCount: 31_201 },
    });

    await expect(toggleFavorite('tiny-glade', 'alex@mail.com')).resolves.toEqual({
      gameSlug: 'tiny-glade',
      isFavorited: true,
      likesCount: 31_201,
    });

    const { url, init } = requestOf(fetchMock);
    expect(url.href).toBe(`${API_BASE_URL}/games/tiny-glade/favorite`);
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"userEmail":"alex@mail.com"}');
  });
});

describe('comments api', () => {
  it('requests the three newest comments for guests', async () => {
    const fetchMock = mockFetch({ data: [], meta: { totalComments: 0 } });

    await fetchLatestComments('tiny-glade');

    const { url } = requestOf(fetchMock);
    expect(Object.fromEntries(url.searchParams)).toEqual({ limit: '3', sort: 'newest' });
  });

  it('posts a new comment and returns the created comment', async () => {
    const created = { commentId: 'c9', authorName: 'Alex', text: 'Nice', likesCount: 0 };
    const fetchMock = mockFetch({ data: created });

    await expect(
      postComment('tiny-glade', { userEmail: 'alex@mail.com', authorName: 'Alex', text: 'Nice' }),
    ).resolves.toEqual(created);

    const { url, init } = requestOf(fetchMock);
    expect(url.href).toBe(`${API_BASE_URL}/games/tiny-glade/comments`);
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"userEmail":"alex@mail.com","authorName":"Alex","text":"Nice"}');
  });

  it('toggles a comment like with the user email in the body', async () => {
    const fetchMock = mockFetch({ data: { isLikedByCurrentUser: true, likesCount: 13 } });

    await expect(toggleCommentLike('c5d9-0001', 'alex@mail.com')).resolves.toEqual({
      isLikedByCurrentUser: true,
      likesCount: 13,
    });

    const { url, init } = requestOf(fetchMock);
    expect(url.href).toBe(`${API_BASE_URL}/comments/c5d9-0001/like`);
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"userEmail":"alex@mail.com"}');
  });

  it('adds userEmail for a signed-in user', async () => {
    const fetchMock = mockFetch({ data: [], meta: { totalComments: 0 } });

    await fetchLatestComments('tiny-glade', { userEmail: 'alex@mail.com' });

    expect(requestOf(fetchMock).url.searchParams.get('userEmail')).toBe('alex@mail.com');
  });
});
