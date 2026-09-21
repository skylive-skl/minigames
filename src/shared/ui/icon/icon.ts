import { createSvgElement } from '@/shared/lib/dom';

function createIconFrame(attributes: Readonly<Record<string, string>>): SVGElement {
  return createSvgElement('svg', {
    viewBox: '0 0 20 20',
    width: '16',
    height: '16',
    'aria-hidden': 'true',
    ...attributes,
  });
}

function buildIcon(
  attributes: Readonly<Record<string, string>>,
  pathD: string,
  pathAttributes?: Readonly<Record<string, string>>,
): SVGElement {
  const svg = createIconFrame(attributes);
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

export function createUploadIcon(): SVGElement {
  return buildIcon(
    { fill: 'none', stroke: 'currentColor', 'stroke-width': '2' },
    'M10 13V3M6.5 6.5L10 3l3.5 3.5M4 15v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1',
    { 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
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

export function createShareIcon(): SVGElement {
  const svg = createIconFrame({ fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' });
  const line = createSvgElement('path', {
    d: 'M7.3 8.7l5.4-2.9M7.3 11.3l5.4 2.9',
    'stroke-linecap': 'round',
  });
  const nodePositions = [
    [14.5, 5],
    [5.5, 10],
    [14.5, 15],
  ] as const;
  const nodes = nodePositions.map(([cx, cy]) =>
    createSvgElement('circle', { cx: String(cx), cy: String(cy), r: '2', fill: 'currentColor' }),
  );

  svg.append(line, ...nodes);

  return svg;
}

export function createMessageIcon(): SVGElement {
  const svg = createIconFrame({ fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' });
  const bubble = createSvgElement('path', {
    d: 'M3 4.5A1.5 1.5 0 0 1 4.5 3h11A1.5 1.5 0 0 1 17 4.5v7A1.5 1.5 0 0 1 15.5 13H7l-3 3v-3H4.5A1.5 1.5 0 0 1 3 11.5z',
    'stroke-linejoin': 'round',
  });
  const lines = createSvgElement('path', {
    d: 'M6 7h8M6 9.5h5',
    'stroke-linecap': 'round',
  });

  svg.append(bubble, lines);

  return svg;
}

export function createRssIcon(): SVGElement {
  const svg = createIconFrame({ fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' });
  const arcs = createSvgElement('path', {
    d: 'M4 8a8 8 0 0 1 8 8M4 3a13 13 0 0 1 13 13',
    'stroke-linecap': 'round',
  });
  const dot = createSvgElement('circle', { cx: '4.5', cy: '15.5', r: '1.5', fill: 'currentColor' });

  svg.append(arcs, dot);

  return svg;
}

export function createCodeIcon(): SVGElement {
  return buildIcon(
    { fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' },
    'M7 6L3 10l4 4M13 6l4 4-4 4',
    { 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
  );
}
