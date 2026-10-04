import { createElement } from '@/shared/lib/dom';
import type { Component } from '@/shared/types/component';
import { createChevronLeftIcon, createChevronRightIcon } from '@/shared/ui/icon/icon';
import './library-pagination.scss';

export interface LibraryPaginationOptions {
  readonly onPageChange: (page: number) => void;
}

export interface PaginationState {
  readonly page: number;
  readonly totalPages: number;
}

export interface LibraryPaginationComponent extends Component {
  // Rebuilds the controls from API metadata without emitting onPageChange.
  readonly update: (state: PaginationState) => void;
}

function getVisiblePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number,
): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const half = Math.floor(maxVisible / 2);
  let start = currentPage - half;

  if (start < 1) {
    start = 1;
  } else if (start + maxVisible - 1 > totalPages) {
    start = totalPages - maxVisible + 1;
  }

  return Array.from({ length: maxVisible }, (_, index) => start + index);
}

export function createLibraryPagination(
  options: LibraryPaginationOptions,
): LibraryPaginationComponent {
  const { onPageChange } = options;
  let currentPage = 1;
  // 0 = empty result: page 1 is still shown, both arrows are disabled.
  let totalPages = 0;

  const mediaQuery = globalThis.matchMedia('(max-width: 768px)');
  let isMobile = mediaQuery.matches;

  const getMaxVisible = (): number => (isMobile ? 3 : 4);

  const previousIcon = createChevronLeftIcon();
  previousIcon.classList.add('library-pagination__arrow-icon');

  const previousButton = createElement('button', {
    className: 'library-pagination__arrow library-pagination__arrow--prev',
    attributes: {
      type: 'button',
      'aria-label': 'Previous page',
    },
    children: [previousIcon],
    onClick: () => {
      if (currentPage > 1) {
        goToPage(currentPage - 1);
      }
    },
  });

  const nextIcon = createChevronRightIcon();
  nextIcon.classList.add('library-pagination__arrow-icon');

  const nextButton = createElement('button', {
    className: 'library-pagination__arrow library-pagination__arrow--next',
    attributes: {
      type: 'button',
      'aria-label': 'Next page',
    },
    children: [nextIcon],
    onClick: () => {
      if (currentPage < totalPages) {
        goToPage(currentPage + 1);
      }
    },
  });

  const pagesContainer = createElement('ul', {
    className: 'library-pagination__list',
  });

  const renderPagination = (): void => {
    const maxVisible = getMaxVisible();
    const visiblePages = getVisiblePageNumbers(currentPage, Math.max(totalPages, 1), maxVisible);

    const isPreviousDisabled = currentPage <= 1;
    const isNextDisabled = currentPage >= totalPages;

    if (isPreviousDisabled) {
      previousButton.disabled = true;
      previousButton.classList.add('library-pagination__arrow--disabled');
    } else {
      previousButton.disabled = false;
      previousButton.classList.remove('library-pagination__arrow--disabled');
    }

    if (isNextDisabled) {
      nextButton.disabled = true;
      nextButton.classList.add('library-pagination__arrow--disabled');
    } else {
      nextButton.disabled = false;
      nextButton.classList.remove('library-pagination__arrow--disabled');
    }

    const items = visiblePages.map((pageNumber) => {
      const isActive = pageNumber === currentPage;
      const pageButton = createElement('button', {
        className: isActive
          ? 'library-pagination__page library-pagination__page--active'
          : 'library-pagination__page',
        text: String(pageNumber),
        attributes: {
          type: 'button',
          'aria-label': `Page ${String(pageNumber)}`,
          ...(isActive && { 'aria-current': 'page' }),
        },
        onClick: () => {
          if (pageNumber !== currentPage) {
            goToPage(pageNumber);
          }
        },
      });

      return createElement('li', {
        className: 'library-pagination__item',
        children: [pageButton],
      });
    });

    pagesContainer.replaceChildren(...items);
  };

  // The URL owns the current page: a click only reports the target page and
  // the controls are rebuilt once the API responds with new metadata.
  const goToPage = (page: number): void => {
    const targetPage = Math.max(1, Math.min(page, totalPages));
    if (targetPage === currentPage) {
      return;
    }

    onPageChange(targetPage);
  };

  const onMediaChange = (event: MediaQueryListEvent): void => {
    isMobile = event.matches;
    renderPagination();
  };

  mediaQuery.addEventListener('change', onMediaChange);

  renderPagination();

  const nav = createElement('nav', {
    className: 'library-pagination',
    attributes: {
      'aria-label': 'Pagination navigation',
    },
    children: [previousButton, pagesContainer, nextButton],
  });

  return {
    element: nav,
    update: (state: PaginationState): void => {
      totalPages = Math.max(0, state.totalPages);
      currentPage = totalPages === 0 ? 1 : Math.max(1, Math.min(state.page, totalPages));
      renderPagination();
    },
    destroy: (): void => {
      mediaQuery.removeEventListener('change', onMediaChange);
    },
  };
}
