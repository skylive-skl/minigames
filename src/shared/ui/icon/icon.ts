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

export function createStarIcon(): SVGElement {
  return buildIcon(
    { fill: 'currentColor' },
    'M10 1.5l2.53 5.32 5.72.55-4.3 4 1.19 5.7-5.14-2.99-5.14 2.99 1.19-5.7-4.3-4 5.72-.55z',
  );
}

export function createHeartIcon(): SVGElement {
  return buildIcon(
    { fill: 'currentColor' },
    'M10 17.3s-6.2-3.85-8.6-7.72C-0.2 6.1 2.1 2.8 5.4 2.8c1.9 0 3.4 1.1 4.6 2.6 1.2-1.5 2.7-2.6 4.6-2.6 3.3 0 5.6 3.3 4 6.78-2.4 3.87-8.6 7.72-8.6 7.72z',
  );
}

export type ArrowDirection = 'left' | 'right';

export function createArrowIcon(direction: ArrowDirection): SVGElement {
  const pathD = direction === 'right' ? 'M7 4l6 6-6 6' : 'M13 4l-6 6 6 6';

  return buildIcon({ fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, pathD, {
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  });
}
