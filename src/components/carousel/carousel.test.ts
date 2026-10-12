import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchFeaturedGames } from '@/shared/api/games-api';
import { ApiError } from '@/shared/api/http';
import { GAME_DETAILS_DIALOG_OPEN_EVENT } from '@/shared/lib/app-events';
import type { Game } from '@/shared/types/game';
import { showSnackbar } from '@/shared/ui/snackbar/snackbar';
import { createGame } from '@/test/fixtures';
import { createCarousel } from './carousel';

vi.mock('@/shared/api/games-api', () => ({ fetchFeaturedGames: vi.fn() }));
vi.mock('@/shared/ui/snackbar/snackbar', () => ({ showSnackbar: vi.fn() }));

const AUTOPLAY_INTERVAL = 4000;
// The slide animation ends via transitionend, with a 450ms safety timer.
const SLIDE_SAFETY_DELAY = 450;

const GAMES: readonly Game[] = ['alpha', 'bravo', 'charlie', 'delta'].map((slug) =>
  createGame({ slug, name: slug.toUpperCase() }),
);

type Carousel = ReturnType<typeof createCarousel>;
const mounted: Carousel[] = [];

async function mountCarousel(): Promise<Carousel> {
  const carousel = createCarousel();
  mounted.push(carousel);
  document.body.append(carousel.element);
  await vi.waitFor(() => {
    expect(carousel.element.querySelector('.carousel__content')?.getAttribute('aria-busy')).toBe(
      'false',
    );
  });
  return carousel;
}

function centerTitle(carousel: Carousel): string | null | undefined {
  return carousel.element.querySelector(':scope .carousel__item--center .game-card__title')
    ?.textContent;
}

function arrowOf(carousel: Carousel, direction: 'left' | 'right'): HTMLButtonElement {
  const arrow = carousel.element.querySelector<HTMLButtonElement>(`.carousel__arrow--${direction}`);
  if (arrow === null) {
    throw new Error(`Arrow ${direction} is missing`);
  }
  return arrow;
}

function pointer(type: string, clientX: number, clientY = 0): Event {
  return new MouseEvent(type, { clientX, clientY, bubbles: true, cancelable: true });
}

describe('carousel', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    vi.mocked(fetchFeaturedGames).mockResolvedValue(GAMES);
  });

  afterEach(() => {
    for (const carousel of mounted.splice(0)) {
      carousel.destroy?.();
    }
    vi.useRealTimers();
  });

  it('shows skeleton slots with disabled arrows while loading', () => {
    vi.mocked(fetchFeaturedGames).mockReturnValue(Promise.withResolvers<readonly Game[]>().promise);

    const carousel = createCarousel();
    mounted.push(carousel);

    expect(carousel.element.querySelectorAll('.game-card--skeleton')).toHaveLength(7);
    expect(arrowOf(carousel, 'left').disabled).toBe(true);
    expect(arrowOf(carousel, 'right').disabled).toBe(true);
  });

  it('renders featured games in seven slots around the first game', async () => {
    const carousel = await mountCarousel();

    expect(carousel.element.querySelectorAll('.carousel__item')).toHaveLength(7);
    expect(centerTitle(carousel)).toBe('ALPHA');
    expect(
      carousel.element.querySelector(':scope .carousel__item--side-left .game-card__title')
        ?.textContent,
    ).toBe('DELTA');
    expect(arrowOf(carousel, 'right').disabled).toBe(false);
  });

  it('moves to the next and previous game with the arrows, wrapping around', async () => {
    const carousel = await mountCarousel();

    arrowOf(carousel, 'right').click();
    vi.advanceTimersByTime(SLIDE_SAFETY_DELAY);
    expect(centerTitle(carousel)).toBe('BRAVO');

    arrowOf(carousel, 'left').click();
    vi.advanceTimersByTime(SLIDE_SAFETY_DELAY);
    arrowOf(carousel, 'left').click();
    vi.advanceTimersByTime(SLIDE_SAFETY_DELAY);
    expect(centerTitle(carousel)).toBe('DELTA');
  });

  it('ignores clicks while a slide is animating', async () => {
    const carousel = await mountCarousel();

    arrowOf(carousel, 'right').click();
    arrowOf(carousel, 'right').click();
    vi.advanceTimersByTime(SLIDE_SAFETY_DELAY);

    expect(centerTitle(carousel)).toBe('BRAVO');
  });

  it('advances automatically every four seconds', async () => {
    const carousel = await mountCarousel();

    vi.advanceTimersByTime(AUTOPLAY_INTERVAL + SLIDE_SAFETY_DELAY);
    expect(centerTitle(carousel)).toBe('BRAVO');

    vi.advanceTimersByTime(AUTOPLAY_INTERVAL);
    expect(centerTitle(carousel)).toBe('CHARLIE');
  });

  it('slides with a horizontal swipe and keeps the card from opening', async () => {
    const carousel = await mountCarousel();
    const viewport = carousel.element.querySelector('.carousel__viewport');
    const opened = vi.fn();
    document.addEventListener(GAME_DETAILS_DIALOG_OPEN_EVENT, opened);

    viewport?.dispatchEvent(pointer('pointerdown', 200));
    viewport?.dispatchEvent(pointer('pointermove', 120));
    viewport?.dispatchEvent(pointer('pointerup', 120));
    carousel.element
      .querySelector<HTMLElement>(':scope .carousel__item--center .game-card')
      ?.click();
    vi.advanceTimersByTime(SLIDE_SAFETY_DELAY);

    expect(centerTitle(carousel)).toBe('BRAVO');
    expect(opened).not.toHaveBeenCalled();
    document.removeEventListener(GAME_DETAILS_DIALOG_OPEN_EVENT, opened);
  });

  it('snaps back after a short drag', async () => {
    const carousel = await mountCarousel();
    const viewport = carousel.element.querySelector('.carousel__viewport');

    viewport?.dispatchEvent(pointer('pointerdown', 200));
    viewport?.dispatchEvent(pointer('pointermove', 180));
    viewport?.dispatchEvent(pointer('pointerup', 180));
    vi.advanceTimersByTime(SLIDE_SAFETY_DELAY);

    expect(centerTitle(carousel)).toBe('ALPHA');
  });

  it('opens game details from a card by click or keyboard', async () => {
    const carousel = await mountCarousel();
    const opened = vi.fn();
    document.addEventListener(GAME_DETAILS_DIALOG_OPEN_EVENT, opened);
    const card = carousel.element.querySelector<HTMLElement>(
      ':scope .carousel__item--center .game-card',
    );

    card?.click();
    card?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    card?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));

    expect(opened).toHaveBeenCalledTimes(2);
    expect(opened).toHaveBeenCalledWith(expect.objectContaining({ detail: 'alpha' }));
    document.removeEventListener(GAME_DETAILS_DIALOG_OPEN_EVENT, opened);
  });

  it('keeps the arrows disabled and does not autoplay with a single game', async () => {
    vi.mocked(fetchFeaturedGames).mockResolvedValue([GAMES[0] ?? createGame()]);

    const carousel = await mountCarousel();
    vi.advanceTimersByTime(AUTOPLAY_INTERVAL * 2);

    expect(arrowOf(carousel, 'right').disabled).toBe(true);
    expect(centerTitle(carousel)).toBe('ALPHA');
  });

  it('shows an empty state when there are no featured games', async () => {
    vi.mocked(fetchFeaturedGames).mockResolvedValue([]);

    const carousel = await mountCarousel();

    expect(carousel.element.textContent).toContain('No new games yet');
  });

  it('shows an error banner and Snackbar, then retries', async () => {
    vi.mocked(fetchFeaturedGames)
      .mockRejectedValueOnce(new ApiError('Server error', 500))
      .mockResolvedValue(GAMES);

    const carousel = await mountCarousel();

    expect(carousel.element.textContent).toContain('Could not load new games');
    expect(showSnackbar).toHaveBeenCalledWith({
      message: 'Failed to load featured games.',
      variant: 'error',
    });

    [...carousel.element.querySelectorAll('button')]
      .find((button) => button.textContent === 'Try again')
      ?.click();

    await vi.waitFor(() => {
      expect(centerTitle(carousel)).toBe('ALPHA');
    });
  });
});
