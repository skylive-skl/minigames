import { createElement } from '@/shared/lib/dom';
import './spinner.scss';

export function createSpinner(className?: string): HTMLSpanElement {
  return createElement('span', {
    className: className === undefined ? 'spinner' : `spinner ${className}`,
    attributes: { 'aria-hidden': 'true' },
  });
}
