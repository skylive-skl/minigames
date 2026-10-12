import { fetchFeaturedGames } from '@/shared/api/games-api';
import { isAbortError } from '@/shared/api/http';
import { dispatchGameDetailsOpen } from '@/shared/lib/app-events';
import { createElement } from '@/shared/lib/dom';
import type { Component } from '@/shared/types/component';
import type { Game } from '@/shared/types/game';
import { createEmptyState, createErrorBanner } from '@/shared/ui/feedback-state/feedback-state';
import { createArrowIcon } from '@/shared/ui/icon/icon';
import { createSkeleton, setBusy } from '@/shared/ui/skeleton/skeleton';
import { showSnackbar } from '@/shared/ui/snackbar/snackbar';
import { createGameCard } from './game-card';
import './carousel.scss';

const AUTOPLAY_INTERVAL = 4000;
const SWIPE_THRESHOLD = 40;

interface SlotConfig {
  readonly offset: number;
  readonly positionClass: string;
}

// Seven slots on desktop (side cards visible), five below it. The outer slots
// sit just past the viewport edges so a slide always reveals a real card.
const WIDE_SLOTS: readonly SlotConfig[] = [
  { offset: -3, positionClass: 'carousel__item--outer-left' },
  { offset: -2, positionClass: 'carousel__item--edge-left' },
  { offset: -1, positionClass: 'carousel__item--side-left' },
  { offset: 0, positionClass: 'carousel__item--center' },
  { offset: 1, positionClass: 'carousel__item--side-right' },
  { offset: 2, positionClass: 'carousel__item--edge-right' },
  { offset: 3, positionClass: 'carousel__item--outer-right' },
];

const COMPACT_SLOTS: readonly SlotConfig[] = [
  { offset: -2, positionClass: 'carousel__item--outer-left' },
  { offset: -1, positionClass: 'carousel__item--edge-left' },
  { offset: 0, positionClass: 'carousel__item--center' },
  { offset: 1, positionClass: 'carousel__item--edge-right' },
  { offset: 2, positionClass: 'carousel__item--outer-right' },
];

// Matches the desktop-up breakpoint in carousel.scss.
const WIDE_LAYOUT_QUERY = '(min-width: 769px)';

const MIN_GAMES_TO_SLIDE = 2;

function createArrowButton(direction: 'left' | 'right'): HTMLButtonElement {
  return createElement('button', {
    className: `carousel__arrow carousel__arrow--${direction}`,
    attributes: {
      type: 'button',
      'aria-label': direction === 'left' ? 'Previous slide' : 'Next slide',
    },
    children: [createArrowIcon(direction)],
  });
}

function createSkeletonTrackItems(slots: readonly SlotConfig[]): HTMLLIElement[] {
  return slots.map((slot) =>
    createElement('li', {
      className: `carousel__item ${slot.positionClass}`,
      children: [
        createElement('div', {
          className: 'game-card game-card--skeleton',
          children: [createSkeleton({ className: 'game-card__skeleton' })],
        }),
      ],
    }),
  );
}

export function createCarousel(): Component {
  let games: readonly Game[] = [];
  let abortController: AbortController | undefined;
  let centerIndex = 0;
  let items: HTMLLIElement[] = [];
  let isAnimating = false;
  let safetyTimer: ReturnType<typeof globalThis.setTimeout> | undefined;

  let isPointerDown = false;
  let startX = 0;
  let startY = 0;
  let currentDeltaX = 0;
  let isDraggingHorizontally = false;
  let hasMovedPointer = false;

  let autoplayTimeoutId: ReturnType<typeof globalThis.setTimeout> | undefined;
  let autoplayStartTime = 0;
  let autoplayRemainingTime = AUTOPLAY_INTERVAL;
  let isAutoplayPaused = false;

  const wideLayoutQuery = globalThis.matchMedia(WIDE_LAYOUT_QUERY);

  const heading = createElement('h2', { className: 'carousel__heading', text: 'New Games' });
  const accent = createElement('span', {
    className: 'carousel__accent',
    attributes: { 'aria-hidden': 'true' },
  });
  const titleGroup = createElement('div', {
    className: 'carousel__title-group',
    children: [accent, heading],
  });

  const leftArrow = createArrowButton('left');
  const rightArrow = createArrowButton('right');

  const arrows = createElement('div', {
    className: 'carousel__arrows',
    children: [leftArrow, rightArrow],
  });

  const header = createElement('div', {
    className: 'carousel__header',
    children: [titleGroup, arrows],
  });

  const track = createElement('ul', { className: 'carousel__track' });
  const trackViewport = createElement('div', {
    className: 'carousel__viewport',
    children: [track],
  });

  const content = createElement('div', {
    className: 'carousel__content',
    children: [trackViewport],
  });

  const element = createElement('section', {
    className: 'carousel',
    attributes: { 'aria-label': 'New Games' },
    children: [header, content],
  });

  function canSlide(): boolean {
    return games.length >= MIN_GAMES_TO_SLIDE;
  }

  function updateArrows(): void {
    const isDisabled = !canSlide();
    leftArrow.disabled = isDisabled;
    rightArrow.disabled = isDisabled;
  }

  function handleCardClick(slug: string): void {
    if (hasMovedPointer) {
      return;
    }
    dispatchGameDetailsOpen(slug);
  }

  function getSlots(): readonly SlotConfig[] {
    return wideLayoutQuery.matches ? WIDE_SLOTS : COMPACT_SLOTS;
  }

  function getGameAt(offset: number): Game {
    const length = games.length;
    return games[(((centerIndex + offset) % length) + length) % length];
  }

  function fillItem(item: HTMLLIElement, game: Game): void {
    item.replaceChildren(
      createGameCard(game, () => {
        handleCardClick(game.slug);
      }),
    );
  }

  function applySlotClasses(): void {
    const slots = getSlots();
    for (const [index, item] of items.entries()) {
      item.className = `carousel__item ${slots[index].positionClass}`;
    }
  }

  function resetTrackPosition(): void {
    track.classList.remove('carousel__track--animating');
    track.style.transition = 'none';
    track.style.transform = 'translateX(0)';
  }

  function renderTrack(): void {
    resetTrackPosition();

    if (games.length === 0) {
      items = [];
      track.replaceChildren();
      return;
    }

    items = getSlots().map((slot) => {
      const item = createElement('li', { className: 'carousel__item' });
      fillItem(item, getGameAt(slot.offset));
      return item;
    });
    applySlotClasses();
    track.replaceChildren(...items);
  }

  function getCurrentOffset(): number {
    const match = /translateX\((-?[\d.]+)px\)/.exec(track.style.transform);
    return match === null ? 0 : Number(match[1]);
  }

  // Cards keep their DOM nodes while sliding: the off-screen card on one end
  // moves to the other end with the next game, every card takes its new slot
  // class and CSS animates the widths. Moving that card shifts the row by one
  // slot, so the track starts offset by the same distance and eases back to 0.
  function slide(direction: 'next' | 'prev'): void {
    if (isAnimating || !canSlide()) {
      return;
    }
    isAnimating = true;

    const startOffset = getCurrentOffset();
    const [first, second] = items;
    const shift = second.getBoundingClientRect().left - first.getBoundingClientRect().left;
    const lastOffset = Math.floor(getSlots().length / 2);

    centerIndex = (centerIndex + (direction === 'next' ? 1 : -1) + games.length) % games.length;

    if (direction === 'next') {
      const moved = items.shift() ?? first;
      fillItem(moved, getGameAt(lastOffset));
      items.push(moved);
      track.append(moved);
    } else {
      const moved = items.pop() ?? first;
      fillItem(moved, getGameAt(-lastOffset));
      items.unshift(moved);
      track.prepend(moved);
    }

    track.style.transition = 'none';
    track.style.transform = `translateX(${String(startOffset + (direction === 'next' ? shift : -shift))}px)`;
    track.getBoundingClientRect();

    track.classList.add('carousel__track--animating');
    track.style.transition = '';
    track.style.transform = 'translateX(0)';
    applySlotClasses();

    const onComplete = (): void => {
      track.removeEventListener('transitionend', handleTransitionEnd);
      if (safetyTimer !== undefined) {
        globalThis.clearTimeout(safetyTimer);
        safetyTimer = undefined;
      }
      track.classList.remove('carousel__track--animating');
      isAnimating = false;
    };

    const handleTransitionEnd = (event: TransitionEvent): void => {
      if (event.target === track && event.propertyName === 'transform') {
        onComplete();
      }
    };

    track.addEventListener('transitionend', handleTransitionEnd);
    safetyTimer = globalThis.setTimeout(onComplete, 450);
  }

  function scheduleAutoplay(delayMs: number): void {
    clearAutoplayTimer();
    if (!canSlide()) {
      return;
    }
    autoplayStartTime = Date.now();
    autoplayTimeoutId = globalThis.setTimeout(() => {
      slide('next');
      autoplayRemainingTime = AUTOPLAY_INTERVAL;
      scheduleAutoplay(AUTOPLAY_INTERVAL);
    }, delayMs);
  }

  function clearAutoplayTimer(): void {
    if (autoplayTimeoutId === undefined) {
      return;
    }
    globalThis.clearTimeout(autoplayTimeoutId);
    autoplayTimeoutId = undefined;
  }

  function pauseAutoplay(): void {
    if (isAutoplayPaused) {
      return;
    }
    isAutoplayPaused = true;
    const elapsed = Date.now() - autoplayStartTime;
    autoplayRemainingTime = Math.max(0, autoplayRemainingTime - elapsed);
    clearAutoplayTimer();
  }

  function resumeAutoplay(): void {
    if (!isAutoplayPaused) {
      return;
    }
    isAutoplayPaused = false;
    if (autoplayRemainingTime <= 50) {
      autoplayRemainingTime = AUTOPLAY_INTERVAL;
    }
    scheduleAutoplay(autoplayRemainingTime);
  }

  function resetAutoplay(): void {
    clearAutoplayTimer();
    isAutoplayPaused = false;
    autoplayRemainingTime = AUTOPLAY_INTERVAL;
    scheduleAutoplay(AUTOPLAY_INTERVAL);
  }

  leftArrow.addEventListener('click', () => {
    slide('prev');
    resetAutoplay();
  });

  rightArrow.addEventListener('click', () => {
    slide('next');
    resetAutoplay();
  });

  trackViewport.addEventListener('pointerdown', (event: PointerEvent) => {
    isPointerDown = true;
    startX = event.clientX;
    startY = event.clientY;
    currentDeltaX = 0;
    isDraggingHorizontally = false;
    hasMovedPointer = false;
    pauseAutoplay();
  });

  trackViewport.addEventListener('pointermove', (event: PointerEvent) => {
    if (!isPointerDown || isAnimating) {
      return;
    }

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    if (!isDraggingHorizontally) {
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
        isPointerDown = false;
        resumeAutoplay();
        return;
      }
      if (Math.abs(deltaX) > 8) {
        isDraggingHorizontally = true;
        hasMovedPointer = true;
        trackViewport.classList.add('carousel__viewport--grabbing');
      }
    }

    if (!isDraggingHorizontally) {
      return;
    }

    event.preventDefault();
    currentDeltaX = deltaX;
    track.style.transition = 'none';
    track.style.transform = `translateX(${String(deltaX)}px)`;
  });

  const handlePointerEnd = (): void => {
    if (!isPointerDown) {
      return;
    }
    isPointerDown = false;
    trackViewport.classList.remove('carousel__viewport--grabbing');

    if (isDraggingHorizontally && Math.abs(currentDeltaX) >= SWIPE_THRESHOLD) {
      track.style.transition = '';
      if (currentDeltaX < 0) {
        slide('next');
      } else {
        slide('prev');
      }
      resetAutoplay();
    } else {
      track.style.transition = 'transform 0.25s ease';
      track.style.transform = 'translateX(0)';
      resumeAutoplay();
    }

    globalThis.setTimeout(() => {
      hasMovedPointer = false;
    }, 100);
  };

  trackViewport.addEventListener('pointerup', handlePointerEnd);
  trackViewport.addEventListener('pointercancel', handlePointerEnd);

  // The slot set differs per breakpoint, so the row is rebuilt when it flips.
  const handleLayoutChange = (): void => {
    if (games.length > 0) {
      renderTrack();
    } else if (content.getAttribute('aria-busy') === 'true') {
      track.replaceChildren(...createSkeletonTrackItems(getSlots()));
    }
  };
  wideLayoutQuery.addEventListener('change', handleLayoutChange);

  function setGames(nextGames: readonly Game[]): void {
    games = nextGames;
    centerIndex = 0;
    renderTrack();
    updateArrows();
    resetAutoplay();
  }

  function showLoading(): void {
    setGames([]);
    track.replaceChildren(...createSkeletonTrackItems(getSlots()));
    content.replaceChildren(trackViewport);
    setBusy(content, true);
  }

  function showGames(nextGames: readonly Game[]): void {
    setBusy(content, false);

    if (nextGames.length === 0) {
      setGames([]);
      content.replaceChildren(
        createEmptyState({
          title: 'No new games yet',
          message: 'Featured games will appear here soon.',
        }),
      );
      return;
    }

    content.replaceChildren(trackViewport);
    setGames(nextGames);
  }

  function showError(message: string): void {
    setBusy(content, false);
    content.replaceChildren(
      createErrorBanner({
        title: 'Could not load new games',
        message,
        onRetry: () => {
          void load();
        },
      }),
    );
    showSnackbar({ message: 'Failed to load featured games.', variant: 'error' });
  }

  async function load(): Promise<void> {
    abortController?.abort();
    const controller = new AbortController();
    abortController = controller;

    showLoading();

    try {
      showGames(await fetchFeaturedGames(controller.signal));
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }
      showError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  void load();

  return {
    element,
    destroy: (): void => {
      abortController?.abort();
      clearAutoplayTimer();
      wideLayoutQuery.removeEventListener('change', handleLayoutChange);
      if (safetyTimer !== undefined) {
        globalThis.clearTimeout(safetyTimer);
      }
    },
  };
}
