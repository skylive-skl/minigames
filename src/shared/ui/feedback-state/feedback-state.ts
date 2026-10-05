import { createElement } from '@/shared/lib/dom';
import './feedback-state.scss';

export interface ErrorBannerOptions {
  readonly title?: string;
  readonly message: string;
  readonly onRetry: () => void;
  readonly retryLabel?: string;
}

export interface EmptyStateOptions {
  readonly title: string;
  readonly message?: string;
}

// Error banner: a request failed (network / server). Always offers a retry.
export function createErrorBanner(options: ErrorBannerOptions): HTMLElement {
  const { title = 'Something went wrong', message, onRetry, retryLabel = 'Try again' } = options;

  const icon = createElement('span', {
    className: 'feedback-state__icon',
    attributes: { 'aria-hidden': 'true' },
    text: '!',
  });

  const retryButton = createElement('button', {
    className: 'feedback-state__action',
    attributes: { type: 'button' },
    text: retryLabel,
    onClick: () => {
      onRetry();
    },
  });

  return createElement('div', {
    className: 'feedback-state feedback-state--error',
    attributes: { role: 'alert' },
    children: [
      icon,
      createElement('p', { className: 'feedback-state__title', text: title }),
      createElement('p', { className: 'feedback-state__message', text: message }),
      retryButton,
    ],
  });
}

// Empty state: the request succeeded but returned nothing for the criteria.
export function createEmptyState(options: EmptyStateOptions): HTMLElement {
  const children: HTMLElement[] = [
    createElement('span', {
      className: 'feedback-state__icon',
      attributes: { 'aria-hidden': 'true' },
      text: '?',
    }),
    createElement('p', { className: 'feedback-state__title', text: options.title }),
  ];

  if (options.message !== undefined) {
    children.push(
      createElement('p', { className: 'feedback-state__message', text: options.message }),
    );
  }

  return createElement('div', {
    className: 'feedback-state feedback-state--empty',
    attributes: { role: 'status' },
    children,
  });
}
