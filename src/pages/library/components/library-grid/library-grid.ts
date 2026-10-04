import { createElement } from '@/shared/lib/dom';
import type { Component } from '@/shared/types/component';
import type { Game } from '@/shared/types/game';
import { createEmptyState, createErrorBanner } from '@/shared/ui/feedback-state/feedback-state';
import { createSkeleton, createSkeletonList, setBusy } from '@/shared/ui/skeleton/skeleton';
import { createLibraryCard } from './library-card';
import './library-grid.scss';

const SKELETON_CARDS_COUNT = 6;

export interface LibraryGridComponent extends Component {
  readonly showLoading: () => void;
  readonly showGames: (games: readonly Game[]) => void;
  readonly showNotFound: () => void;
  readonly showError: (message: string, onRetry: () => void) => void;
}

function createListItem(content: HTMLElement): HTMLLIElement {
  return createElement('li', { className: 'library-grid__item', children: [content] });
}

function createSkeletonCard(): HTMLElement {
  const text = (modifier: string): HTMLElement =>
    createSkeleton({ shape: 'text', className: `library-card__skeleton-${modifier}` });

  return createElement('div', {
    className: 'library-card library-card--skeleton',
    children: [
      createElement('div', {
        className: 'library-card__media',
        children: [createSkeleton()],
      }),
      createElement('div', {
        className: 'library-card__body library-card__skeleton-body',
        children: [text('title'), text('line'), text('line'), text('footer')],
      }),
    ],
  });
}

export function createLibraryGrid(): LibraryGridComponent {
  const list = createElement('ul', { className: 'library-grid__list' });

  const element = createElement('section', {
    className: 'library-grid',
    attributes: { 'aria-label': 'Games catalog' },
    children: [list],
  });

  function showLoading(): void {
    list.replaceChildren(
      ...createSkeletonList(SKELETON_CARDS_COUNT, () => createListItem(createSkeletonCard())),
    );
    element.replaceChildren(list);
    setBusy(element, true);
  }

  function showGames(games: readonly Game[]): void {
    setBusy(element, false);
    list.replaceChildren(...games.map((game) => createListItem(createLibraryCard(game))));
    element.replaceChildren(list);
  }

  function showNotFound(): void {
    setBusy(element, false);
    element.replaceChildren(
      createEmptyState({
        title: 'Data Not Found',
        message: 'No games match these filters. Try another category, sort order or page.',
      }),
    );
  }

  function showError(message: string, onRetry: () => void): void {
    setBusy(element, false);
    element.replaceChildren(createErrorBanner({ title: 'Could not load games', message, onRetry }));
  }

  return { element, showLoading, showGames, showNotFound, showError };
}
