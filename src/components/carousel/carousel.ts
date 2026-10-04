import { dispatchGameDetailsOpen } from '@/shared/lib/app-events';
import { createElement } from '@/shared/lib/dom';
import type { Component } from '@/shared/types/component';
import type { Game } from '@/shared/types/game';
import { createArrowIcon } from '@/shared/ui/icon/icon';
import { createGameCard, type CardPosition } from './game-card';
import './carousel.scss';

const AUTOPLAY_INTERVAL = 4000;
const SWIPE_THRESHOLD = 40;

interface SlotConfig {
  readonly offset: number;
  readonly positionClass: string;
  readonly cardPosition: CardPosition;
}

const SLOTS: readonly SlotConfig[] = [
  { offset: -3, positionClass: 'carousel__item--outer-left', cardPosition: 'outer' },
  { offset: -2, positionClass: 'carousel__item--edge-left', cardPosition: 'edge' },
  { offset: -1, positionClass: 'carousel__item--side-left', cardPosition: 'side' },
  { offset: 0, positionClass: 'carousel__item--center', cardPosition: 'center' },
  { offset: 1, positionClass: 'carousel__item--side-right', cardPosition: 'side' },
  { offset: 2, positionClass: 'carousel__item--edge-right', cardPosition: 'edge' },
  { offset: 3, positionClass: 'carousel__item--outer-right', cardPosition: 'outer' },
];

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

export interface CarouselComponent extends Component {
  readonly setGames: (games: readonly Game[]) => void;
}

export function createCarousel(): CarouselComponent {
  let games: readonly Game[] = [];
  let centerIndex = 0;
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

  const element = createElement('section', {
    className: 'carousel',
    attributes: { 'aria-label': 'New Games' },
    children: [header, trackViewport],
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

  function renderTrack(): void {
    if (games.length === 0) {
      track.replaceChildren();
      return;
    }

    const items = SLOTS.map((slot) => {
      const gameIndex = (centerIndex + slot.offset + games.length * SLOTS.length) % games.length;
      const game = games[gameIndex];
      const card = createGameCard(game, slot.cardPosition, () => {
        handleCardClick(game.slug);
      });

      return createElement('li', {
        className: `carousel__item ${slot.positionClass}`,
        children: [card],
      });
    });

    track.replaceChildren(...items);
  }

  function getShiftDistance(): number {
    const centerItem = track.querySelector('.carousel__item--center');
    const nextItem =
      track.querySelector('.carousel__item--side-right') ??
      track.querySelector('.carousel__item--edge-right');

    if (centerItem instanceof HTMLElement && nextItem instanceof HTMLElement) {
      const centerRect = centerItem.getBoundingClientRect();
      const nextRect = nextItem.getBoundingClientRect();
      const distance =
        nextRect.left + nextRect.width / 2 - (centerRect.left + centerRect.width / 2);
      if (distance > 20) {
        return distance;
      }
    }

    return 300;
  }

  function slide(direction: 'next' | 'prev'): void {
    if (isAnimating || !canSlide()) {
      return;
    }
    isAnimating = true;

    const distance = getShiftDistance();
    const shiftPx = direction === 'next' ? -distance : distance;
    const animationClass =
      direction === 'next' ? 'carousel__track--slide-next' : 'carousel__track--slide-prev';

    track.classList.add('carousel__track--animating', animationClass);
    track.style.transform = `translateX(${String(shiftPx)}px)`;

    const onComplete = (): void => {
      track.removeEventListener('transitionend', handleTransitionEnd);
      if (safetyTimer !== undefined) {
        globalThis.clearTimeout(safetyTimer);
        safetyTimer = undefined;
      }

      centerIndex = (centerIndex + (direction === 'next' ? 1 : -1) + games.length) % games.length;

      track.classList.remove('carousel__track--animating', animationClass);
      track.style.transition = 'none';
      track.style.transform = 'translateX(0)';
      track.getBoundingClientRect();
      track.style.transition = '';

      renderTrack();
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
    if (!isPointerDown) {
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

  function setGames(nextGames: readonly Game[]): void {
    games = nextGames;
    centerIndex = 0;
    renderTrack();
    updateArrows();
    resetAutoplay();
  }

  updateArrows();

  return {
    element,
    setGames,
    destroy: (): void => {
      clearAutoplayTimer();
      if (safetyTimer !== undefined) {
        globalThis.clearTimeout(safetyTimer);
      }
    },
  };
}
