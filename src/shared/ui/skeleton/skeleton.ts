import { createElement } from '@/shared/lib/dom';
import './skeleton.scss';

export type SkeletonShape = 'block' | 'text' | 'circle';

export interface SkeletonOptions {
  readonly shape?: SkeletonShape;
  readonly className?: string;
}

// Placeholders are decorative: the loading container itself should carry
// aria-busy="true" so assistive technology announces the pending state.
export function createSkeleton(options: SkeletonOptions = {}): HTMLElement {
  const { shape = 'block', className } = options;
  const classes = ['skeleton', `skeleton--${shape}`];

  if (className !== undefined) {
    classes.push(className);
  }

  return createElement('span', {
    className: classes.join(' '),
    attributes: { 'aria-hidden': 'true' },
  });
}

export function createSkeletonList(count: number, factory: () => HTMLElement): HTMLElement[] {
  return Array.from({ length: count }, () => factory());
}

export function setBusy(container: HTMLElement, isBusy: boolean): void {
  container.setAttribute('aria-busy', String(isBusy));
}
