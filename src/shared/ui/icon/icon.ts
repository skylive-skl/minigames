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

export function createCloseIcon(): SVGElement {
  return buildIcon(
    { fill: 'none', stroke: 'currentColor', 'stroke-width': '2' },
    'M5 5l10 10M15 5L5 15',
    { 'stroke-linecap': 'round' },
  );
}

export function createPersonIcon(): SVGElement {
  const svg = createIconFrame({ fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' });
  const head = createSvgElement('circle', { cx: '10', cy: '6.5', r: '3' });
  const body = createSvgElement('path', {
    d: 'M3.5 17a6.5 6.5 0 0 1 13 0',
    'stroke-linecap': 'round',
  });

  svg.append(head, body);

  return svg;
}

export function createEmailIcon(): SVGElement {
  const svg = createIconFrame({ fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' });
  const envelope = createSvgElement('rect', {
    x: '2.5',
    y: '4.5',
    width: '15',
    height: '11',
    rx: '1.5',
  });
  const flap = createSvgElement('path', {
    d: 'M3 5.5l7 5.5 7-5.5',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  });

  svg.append(envelope, flap);

  return svg;
}

export function createLockIcon(): SVGElement {
  const svg = createIconFrame({ fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' });
  const body = createSvgElement('rect', {
    x: '4',
    y: '9',
    width: '12',
    height: '8',
    rx: '1.5',
  });
  const shackle = createSvgElement('path', { d: 'M6.5 9V6a3.5 3.5 0 0 1 7 0v3' });

  svg.append(body, shackle);

  return svg;
}

export function createEyeIcon(): SVGElement {
  const svg = createIconFrame({ fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' });
  const outline = createSvgElement('path', {
    d: 'M1.5 10S4.5 4.5 10 4.5 18.5 10 18.5 10 15.5 15.5 10 15.5 1.5 10 1.5 10z',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  });
  const pupil = createSvgElement('circle', { cx: '10', cy: '10', r: '2.5' });

  svg.append(outline, pupil);

  return svg;
}

export function createEyeOffIcon(): SVGElement {
  const svg = createIconFrame({ fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' });
  const outline = createSvgElement('path', {
    d: 'M1.5 10S4.5 4.5 10 4.5 18.5 10 18.5 10 15.5 15.5 10 15.5 1.5 10 1.5 10z',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  });
  const pupil = createSvgElement('circle', { cx: '10', cy: '10', r: '2.5' });
  const slash = createSvgElement('path', { d: 'M3 17L17 3', 'stroke-linecap': 'round' });

  svg.append(outline, pupil, slash);

  return svg;
}

export function createGoogleIcon(): SVGElement {
  const svg = createSvgElement('svg', {
    viewBox: '0 0 20 20',
    width: '18',
    height: '18',
    'aria-hidden': 'true',
  });
  const paths = [
    {
      d: 'M19.6 10.23c0-.68-.06-1.33-.17-1.96H10v3.71h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 3-4.32 3-7.27z',
      fill: '#4285f4',
    },
    {
      d: 'M10 20c2.7 0 4.96-.9 6.62-2.43l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.75-5.59-4.11H1.06v2.59A10 10 0 0 0 10 20z',
      fill: '#34a853',
    },
    { d: 'M4.41 11.92a5.99 5.99 0 0 1 0-3.84V5.49H1.06a10 10 0 0 0 0 9.02z', fill: '#fbbc05' },
    {
      d: 'M10 3.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.96 9.96 0 0 0 10 0 10 10 0 0 0 1.06 5.49l3.35 2.6C5.2 5.72 7.4 3.96 10 3.96z',
      fill: '#ea4335',
    },
  ] as const;

  svg.append(...paths.map((path) => createSvgElement('path', { d: path.d, fill: path.fill })));

  return svg;
}
