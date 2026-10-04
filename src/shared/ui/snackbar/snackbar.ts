import { createElement } from '@/shared/lib/dom';
import { createCloseIcon } from '@/shared/ui/icon/icon';
import './snackbar.scss';

export type SnackbarVariant = 'success' | 'error' | 'info';

export interface SnackbarOptions {
  readonly message: string;
  readonly variant?: SnackbarVariant;
  readonly duration?: number;
}

const DEFAULT_DURATION = 4000;
const MAX_VISIBLE_SNACKBARS = 3;
const LEAVE_FALLBACK_DELAY = 300;

const REGION_CLASS_NAME = 'snackbar-region';

// The region is a manual popover so it lives in the top layer and stays
// visible above modal <dialog> elements opened with showModal().
function getRegion(): HTMLElement {
  const existing = document.querySelector<HTMLElement>(`.${REGION_CLASS_NAME}`);

  if (existing !== null) {
    return existing;
  }

  const region = createElement('div', {
    className: REGION_CLASS_NAME,
    attributes: { popover: 'manual', 'aria-live': 'polite' },
  });
  document.body.append(region);

  return region;
}

function bringRegionToFront(container: HTMLElement): void {
  if (container.matches(':popover-open')) {
    container.hidePopover();
  }
  container.showPopover();
}

function hideRegionIfEmpty(container: HTMLElement): void {
  if (container.childElementCount === 0 && container.matches(':popover-open')) {
    container.hidePopover();
  }
}

function dismiss(item: HTMLElement, container: HTMLElement): void {
  if (item.classList.contains('snackbar--leaving')) {
    return;
  }

  const remove = (): void => {
    item.remove();
    hideRegionIfEmpty(container);
  };

  item.classList.add('snackbar--leaving');
  item.addEventListener('animationend', remove, { once: true });
  globalThis.setTimeout(remove, LEAVE_FALLBACK_DELAY);
}

export function showSnackbar(options: SnackbarOptions): void {
  const { message, variant = 'info', duration = DEFAULT_DURATION } = options;
  const container = getRegion();

  const text = createElement('p', { className: 'snackbar__message', text: message });

  const closeButton = createElement('button', {
    className: 'snackbar__close',
    attributes: { type: 'button', 'aria-label': 'Dismiss notification' },
    children: [createCloseIcon()],
  });

  const item = createElement('div', {
    className: `snackbar snackbar--${variant}`,
    attributes: { role: variant === 'error' ? 'alert' : 'status' },
    children: [text, closeButton],
  });

  const timerId = globalThis.setTimeout(() => {
    dismiss(item, container);
  }, duration);

  closeButton.addEventListener('click', () => {
    globalThis.clearTimeout(timerId);
    dismiss(item, container);
  });

  const overflow = container.childElementCount - MAX_VISIBLE_SNACKBARS + 1;
  const staleItems = [...container.children].slice(0, Math.max(0, overflow));
  for (const oldItem of staleItems) {
    if (oldItem instanceof HTMLElement) {
      dismiss(oldItem, container);
    }
  }

  container.append(item);
  bringRegionToFront(container);
}
