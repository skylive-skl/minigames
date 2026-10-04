import { fetchCategories } from '@/shared/api/categories-api';
import { isAbortError } from '@/shared/api/http';
import { createElement } from '@/shared/lib/dom';
import type { Component } from '@/shared/types/component';
import type { Category, SortValue } from '@/shared/types/game';
import { createErrorBanner } from '@/shared/ui/feedback-state/feedback-state';
import { createSkeleton, createSkeletonList, setBusy } from '@/shared/ui/skeleton/skeleton';
import { showSnackbar } from '@/shared/ui/snackbar/snackbar';
import './library-filter.scss';

export interface SortOption {
  readonly value: SortValue;
  readonly label: string;
}

// Values are the API's `sort` parameter; the order matches the dropdown.
export const SORT_OPTIONS: readonly SortOption[] = [
  { value: 'rating-desc', label: 'Rating ↓' },
  { value: 'rating-asc', label: 'Rating ↑' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
];

function enableDragScroll(container: HTMLElement): () => void {
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;
  let hasMoved = false;

  const onMouseDown = (event: MouseEvent): void => {
    isDown = true;
    hasMoved = false;
    startX = event.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
    container.style.cursor = 'grabbing';
  };

  const onMouseLeave = (): void => {
    isDown = false;
    container.style.cursor = 'grab';
  };

  const onMouseUp = (): void => {
    isDown = false;
    container.style.cursor = 'grab';
  };

  const onMouseMove = (event: MouseEvent): void => {
    if (!isDown) {
      return;
    }
    event.preventDefault();
    const x = event.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 4) {
      hasMoved = true;
    }
    container.scrollLeft = scrollLeft - walk;
  };

  const onClickCapture = (event: MouseEvent): void => {
    if (!hasMoved) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();
  };

  container.addEventListener('mousedown', onMouseDown);
  container.addEventListener('mouseleave', onMouseLeave);
  container.addEventListener('mouseup', onMouseUp);
  container.addEventListener('mousemove', onMouseMove);
  container.addEventListener('click', onClickCapture, { capture: true });

  return () => {
    container.removeEventListener('mousedown', onMouseDown);
    container.removeEventListener('mouseleave', onMouseLeave);
    container.removeEventListener('mouseup', onMouseUp);
    container.removeEventListener('mousemove', onMouseMove);
    container.removeEventListener('click', onClickCapture, true);
  };
}

const SKELETON_CHIPS_COUNT = 7;

export interface LibraryFilterOptions {
  readonly initialSort: SortValue;
  readonly onCategoryChange: (category: string) => void;
  readonly onSortChange: (sort: SortValue) => void;
}

export interface LibraryFilterComponent extends Component {
  // undefined = no category in the URL: highlight the API's default chip.
  readonly setActiveCategory: (category: string | undefined) => void;
  readonly setActiveSort: (sort: SortValue) => void;
}

function getSortDisplayText(sort: SortValue): string {
  const option = SORT_OPTIONS.find((item) => item.value === sort);
  return `Sort by: ${option?.label ?? sort}`;
}

export function createLibraryFilter(options: LibraryFilterOptions): LibraryFilterComponent {
  let requestedCategory: string | undefined;
  let categories: readonly Category[] = [];
  let abortController: AbortController | undefined;
  let activeSort = options.initialSort;
  let isSortOpen = false;

  const heading = createElement('h1', {
    className: 'library-filter__heading',
    text: 'Game Library',
  });

  const subtitle = createElement('p', {
    className: 'library-filter__subtitle',
    text: 'Browse our collection of casual mini-games',
  });

  const header = createElement('div', {
    className: 'library-filter__header',
    children: [heading, subtitle],
  });

  const chipButtons: { button: HTMLButtonElement; slug: string }[] = [];

  function getActiveSlug(): string | undefined {
    return requestedCategory ?? categories.find((category) => category.isDefault)?.slug;
  }

  function updateActiveChip(): void {
    const activeSlug = getActiveSlug();

    for (const item of chipButtons) {
      const isActive = item.slug === activeSlug;
      item.button.classList.toggle('library-filter__chip--active', isActive);
      item.button.setAttribute('aria-selected', String(isActive));
    }
  }

  const chipsContainer = createElement('div', {
    className: 'library-filter__chips-container',
    attributes: {
      role: 'tablist',
      'aria-label': 'Filter by category',
    },
  });

  const chipsStatus = createElement('div', { className: 'library-filter__chips-status' });

  function renderChips(): void {
    chipButtons.length = 0;

    const chips = categories.map((category) => {
      const button = createElement('button', {
        className: 'library-filter__chip',
        text: category.label,
        attributes: { type: 'button', role: 'tab' },
        onClick: () => {
          if (category.slug !== getActiveSlug()) {
            options.onCategoryChange(category.slug);
          }
        },
      });

      chipButtons.push({ button, slug: category.slug });
      return button;
    });

    chipsContainer.replaceChildren(...chips);
    updateActiveChip();
  }

  function showChipsLoading(): void {
    chipsStatus.replaceChildren();
    chipsContainer.replaceChildren(
      ...createSkeletonList(SKELETON_CHIPS_COUNT, () =>
        createSkeleton({ className: 'library-filter__chip-skeleton' }),
      ),
    );
    setBusy(chipsContainer, true);
  }

  function showChipsError(message: string): void {
    chipsContainer.replaceChildren();
    chipsStatus.replaceChildren(
      createErrorBanner({
        title: 'Could not load categories',
        message,
        onRetry: () => {
          void loadCategories();
        },
      }),
    );
    showSnackbar({ message: 'Failed to load categories.', variant: 'error' });
  }

  async function loadCategories(): Promise<void> {
    abortController?.abort();
    const controller = new AbortController();
    abortController = controller;

    showChipsLoading();

    try {
      categories = await fetchCategories(controller.signal);
      setBusy(chipsContainer, false);
      renderChips();
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }
      setBusy(chipsContainer, false);
      showChipsError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  const cleanupDrag = enableDragScroll(chipsContainer);

  const sortLabel = createElement('span', {
    className: 'library-filter__sort-label',
    text: getSortDisplayText(activeSort),
  });

  const sortButton = createElement('button', {
    className: 'library-filter__sort-btn',
    attributes: {
      type: 'button',
      'aria-haspopup': 'listbox',
      'aria-expanded': 'false',
      'aria-label': 'Sort games',
    },
    children: [sortLabel],
  });

  const sortOptionItems: { item: HTMLLIElement; option: SortOption }[] = [];

  const closeSort = (): void => {
    isSortOpen = false;
    sortButton.setAttribute('aria-expanded', 'false');
    sortMenu.hidden = true;
  };

  const openSort = (): void => {
    isSortOpen = true;
    sortButton.setAttribute('aria-expanded', 'true');
    sortMenu.hidden = false;
  };

  const toggleSort = (): void => {
    if (isSortOpen) {
      closeSort();
    } else {
      openSort();
    }
  };

  const updateSortUi = (sort: SortValue): void => {
    activeSort = sort;
    sortLabel.textContent = getSortDisplayText(sort);
    for (const entry of sortOptionItems) {
      const isSelected = entry.option.value === activeSort;
      entry.item.classList.toggle('library-filter__sort-option--active', isSelected);
      entry.item.setAttribute('aria-selected', String(isSelected));
    }
  };

  // The URL owns the sort value: the dropdown only reports the choice and is
  // re-synced through setActiveSort once the URL changes.
  const selectSort = (option: SortOption): void => {
    closeSort();
    if (option.value !== activeSort) {
      options.onSortChange(option.value);
    }
  };

  const sortOptions = SORT_OPTIONS.map((opt) => {
    const isSelected = opt.value === activeSort;
    const item = createElement('li', {
      className: isSelected
        ? 'library-filter__sort-option library-filter__sort-option--active'
        : 'library-filter__sort-option',
      text: opt.label,
      attributes: {
        role: 'option',
        'aria-selected': String(isSelected),
      },
      onClick: () => {
        selectSort(opt);
      },
    });

    sortOptionItems.push({ item, option: opt });
    return item;
  });

  const sortMenu = createElement('ul', {
    className: 'library-filter__sort-menu',
    attributes: {
      role: 'listbox',
      'aria-label': 'Sort options',
    },
    children: sortOptions,
  });
  sortMenu.hidden = true;

  sortButton.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleSort();
  });

  const onDocumentClick = (event: MouseEvent): void => {
    if (!isSortOpen) {
      return;
    }
    const target = event.target as Node | null;
    if (target && !sortWrapper.contains(target)) {
      closeSort();
    }
  };

  const onDocumentKeyDown = (event: KeyboardEvent): void => {
    if (!isSortOpen || event.key !== 'Escape') {
      return;
    }

    closeSort();
    sortButton.focus();
  };

  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onDocumentKeyDown);

  const sortWrapper = createElement('div', {
    className: 'library-filter__sort',
    children: [sortButton, sortMenu],
  });

  const toolbar = createElement('div', {
    className: 'library-filter__toolbar',
    children: [chipsContainer, sortWrapper],
  });

  const container = createElement('div', {
    className: 'library-filter__container',
    children: [header, toolbar, chipsStatus],
  });

  const element = createElement('section', {
    className: 'library-filter',
    attributes: { 'aria-label': 'Library games filtering and sorting' },
    children: [container],
  });

  void loadCategories();

  return {
    element,
    setActiveCategory: (category: string | undefined): void => {
      requestedCategory = category;
      updateActiveChip();
    },
    setActiveSort: updateSortUi,
    destroy: (): void => {
      abortController?.abort();
      cleanupDrag();
      document.removeEventListener('click', onDocumentClick);
      document.removeEventListener('keydown', onDocumentKeyDown);
    },
  };
}
