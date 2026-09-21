import { createSvgElement } from '@/shared/lib/dom';

function buildIcon(
  attributes: Readonly<Record<string, string>>,
  pathD: string,
  pathAttributes?: Readonly<Record<string, string>>,
): SVGElement {
  const svg = createSvgElement('svg', {
    viewBox: '0 0 20 20',
    width: '16',
    height: '16',
    'aria-hidden': 'true',
    ...attributes,
  });
  const path = createSvgElement('path', { d: pathD, ...pathAttributes });

  svg.append(path);

  return svg;
}

export type ArrowDirection = 'left' | 'right';

export function createArrowIcon(direction: ArrowDirection): SVGElement {
  const pathD = direction === 'right' ? 'M7 4l6 6-6 6' : 'M13 4l-6 6 6 6';

  return buildIcon({ fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, pathD, {
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  });
}
