import { describe, expect, it, vi } from 'vitest';
import { createLibraryPagination } from './library-pagination';

function pageLabels(element: HTMLElement): string[] {
  return [...element.querySelectorAll('.library-pagination__page')].map(
    (button) => button.textContent,
  );
}

function arrow(element: HTMLElement, direction: 'prev' | 'next'): HTMLButtonElement {
  const button = element.querySelector<HTMLButtonElement>(
    `.library-pagination__arrow--${direction}`,
  );
  if (button === null) {
    throw new Error(`Arrow ${direction} is missing`);
  }
  return button;
}

function mockMobileViewport(isMobile: boolean): void {
  // The setup stub returns a fresh object per call, so it can be adjusted.
  const mediaQueryList = Object.assign(globalThis.matchMedia('(max-width: 768px)'), {
    matches: isMobile,
  });
  vi.spyOn(globalThis, 'matchMedia').mockReturnValue(mediaQueryList);
}

describe('library pagination', () => {
  it('shows as many buttons as pages when there are few pages', () => {
    const pagination = createLibraryPagination({ onPageChange: vi.fn() });

    pagination.update({ page: 1, totalPages: 2 });

    expect(pageLabels(pagination.element)).toEqual(['1', '2']);
    expect(arrow(pagination.element, 'prev').disabled).toBe(true);
    expect(arrow(pagination.element, 'next').disabled).toBe(false);
  });

  it('keeps a window of four pages around the current one on desktop', () => {
    const pagination = createLibraryPagination({ onPageChange: vi.fn() });

    pagination.update({ page: 5, totalPages: 10 });
    expect(pageLabels(pagination.element)).toEqual(['3', '4', '5', '6']);

    pagination.update({ page: 10, totalPages: 10 });
    expect(pageLabels(pagination.element)).toEqual(['7', '8', '9', '10']);
    expect(arrow(pagination.element, 'next').disabled).toBe(true);
  });

  it('keeps a window of three pages on mobile', () => {
    mockMobileViewport(true);
    const pagination = createLibraryPagination({ onPageChange: vi.fn() });

    pagination.update({ page: 5, totalPages: 10 });

    expect(pageLabels(pagination.element)).toEqual(['4', '5', '6']);
  });

  it('marks the current page and reports clicks on other pages and arrows', () => {
    const onPageChange = vi.fn();
    const pagination = createLibraryPagination({ onPageChange });
    pagination.update({ page: 2, totalPages: 4 });

    const current = pagination.element.querySelector('[aria-current="page"]');
    expect(current?.textContent).toBe('2');

    (current as HTMLButtonElement | null)?.click();
    expect(onPageChange).not.toHaveBeenCalled();

    arrow(pagination.element, 'next').click();
    arrow(pagination.element, 'prev').click();
    [...pagination.element.querySelectorAll<HTMLButtonElement>('.library-pagination__page')]
      .find((button) => button.textContent === '4')
      ?.click();

    expect(onPageChange.mock.calls).toEqual([[3], [1], [4]]);
  });

  it('clamps the page into range from API metadata', () => {
    const pagination = createLibraryPagination({ onPageChange: vi.fn() });

    pagination.update({ page: 9, totalPages: 3 });

    expect(pagination.element.querySelector('[aria-current="page"]')?.textContent).toBe('3');
  });
});
