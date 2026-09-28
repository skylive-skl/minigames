import { categories } from '@/data/categories';
import { createElement } from '@/shared/lib/dom';
import type { Component } from '@/shared/types/component';
import type { CategorySlug } from '@/shared/types/game';
import './library-filter.scss';

export interface SortOption {
  readonly id: string;
  readonly label: string;
}

export const SORT_OPTIONS: readonly SortOption[] = [
  { id: 'rating', label: 'Rating' },
  { id: 'popular', label: 'Popular' },
  { id: 'newest', label: 'Newest' },
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

function getSortDisplayText(label: string): string {
  return `Sort by: ${label} ↓`;
}

export function createLibraryFilter(): Component {
  let activeCategory: CategorySlug = 'all';
  let activeSortId = SORT_OPTIONS[0]?.id ?? 'rating';
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

  const chipButtons: { button: HTMLButtonElement; slug: CategorySlug }[] = [];

  const updateActiveChip = (slug: CategorySlug): void => {
    activeCategory = slug;
    for (const item of chipButtons) {
      const isActive = item.slug === activeCategory;
      item.button.classList.toggle('library-filter__chip--active', isActive);
      if (isActive) {
        item.button.setAttribute('aria-selected', 'true');
      } else if (item.button.hasAttribute('aria-selected')) {
        item.button.removeAttribute('aria-selected');
      }
    }
  };

  const chips = categories.map((cat) => {
    const isInitial = cat.slug === activeCategory;
    const button = createElement('button', {
      className: isInitial
        ? 'library-filter__chip library-filter__chip--active'
        : 'library-filter__chip',
      text: cat.label,
      attributes: {
        type: 'button',
        role: 'tab',
        ...(isInitial && { 'aria-selected': 'true' }),
      },
      onClick: () => {
        updateActiveChip(cat.slug);
      },
    });

    chipButtons.push({ button, slug: cat.slug });
    return button;
  });

  const chipsContainer = createElement('div', {
    className: 'library-filter__chips-container',
    attributes: {
      role: 'tablist',
      'aria-label': 'Filter by category',
    },
    children: chips,
  });

  const cleanupDrag = enableDragScroll(chipsContainer);

  const sortLabel = createElement('span', {
    className: 'library-filter__sort-label',
    text: getSortDisplayText(SORT_OPTIONS[0]?.label ?? 'Rating'),
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

  const selectSort = (option: SortOption): void => {
    activeSortId = option.id;
    sortLabel.textContent = getSortDisplayText(option.label);
    for (const entry of sortOptionItems) {
      const isSelected = entry.option.id === activeSortId;
      entry.item.classList.toggle('library-filter__sort-option--active', isSelected);
      entry.item.setAttribute('aria-selected', String(isSelected));
    }
    closeSort();
  };

  const sortOptions = SORT_OPTIONS.map((opt) => {
    const isSelected = opt.id === activeSortId;
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
    children: [header, toolbar],
  });

  const element = createElement('section', {
    className: 'library-filter',
    attributes: { 'aria-label': 'Library games filtering and sorting' },
    children: [container],
  });

  return {
    element,
    destroy: (): void => {
      cleanupDrag();
      document.removeEventListener('click', onDocumentClick);
      document.removeEventListener('keydown', onDocumentKeyDown);
    },
  };
}
