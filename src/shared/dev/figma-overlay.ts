import { createElement } from '@/shared/lib/dom';
import './figma-overlay.scss';

const OFFSET_STEP_PX = 10;
const MAX_OPACITY = 100;
const DEFAULT_OPACITY = 50;

interface OverlayReference {
  readonly maxWidth: number;
  readonly file: string;
}

const REFERENCES: readonly OverlayReference[] = [
  { maxWidth: 480, file: 'home-mobile-375.png' },
  { maxWidth: 768, file: 'home-tablet-768.png' },
  { maxWidth: Infinity, file: 'home-desktop-1920.png' },
];

const ARROW_OFFSETS: Readonly<Partial<Record<string, readonly [number, number]>>> = {
  ArrowUp: [0, -OFFSET_STEP_PX],
  ArrowDown: [0, OFFSET_STEP_PX],
  ArrowLeft: [-OFFSET_STEP_PX, 0],
  ArrowRight: [OFFSET_STEP_PX, 0],
};

function resolveReferenceFile(width: number): string {
  const match = REFERENCES.find((item) => width <= item.maxWidth) ?? REFERENCES.at(-1);
  return match === undefined ? REFERENCES[0].file : match.file;
}

export function initFigmaOverlay(): void {
  let isVisible = false;
  let opacity = DEFAULT_OPACITY;
  let blendMode: 'difference' | 'normal' = 'normal';
  let offsetX = 0;
  let offsetY = 0;

  const image = createElement('img', { className: 'figma-overlay-image' });
  const opacityInput = createElement('input', {
    attributes: {
      type: 'range',
      min: '0',
      max: String(MAX_OPACITY),
      value: String(DEFAULT_OPACITY),
    },
  });
  const blendButton = createElement('button', {
    text: 'blend: normal',
    attributes: { type: 'button' },
  });
  const panel = createElement('div', {
    className: 'figma-overlay-panel',
    children: [opacityInput, blendButton],
  });

  document.body.append(image, panel);

  function render(): void {
    image.src = `/__design-refs__/${resolveReferenceFile(globalThis.innerWidth)}`;
    image.style.display = isVisible ? 'block' : 'none';
    image.style.opacity = String(opacity / MAX_OPACITY);
    image.style.mixBlendMode = blendMode;
    image.style.transform = `translateX(-50%) translate(${String(offsetX)}px, ${String(offsetY)}px)`;
    panel.style.display = isVisible ? 'flex' : 'none';
    blendButton.textContent = `blend: ${blendMode}`;
  }

  opacityInput.addEventListener('input', () => {
    opacity = Number(opacityInput.value);
    render();
  });

  blendButton.addEventListener('click', () => {
    blendMode = blendMode === 'normal' ? 'difference' : 'normal';
    render();
  });

  const resizeObserver = new ResizeObserver(() => {
    render();
  });
  resizeObserver.observe(document.documentElement);

  globalThis.addEventListener('keydown', (event) => {
    if (event.altKey && event.key.toLowerCase() === 'o') {
      event.preventDefault();
      isVisible = !isVisible;
      render();
      return;
    }

    if (!isVisible || !event.altKey) {
      return;
    }

    const delta = ARROW_OFFSETS[event.key];

    if (delta === undefined) {
      return;
    }

    event.preventDefault();
    offsetX += delta[0];
    offsetY += delta[1];
    render();
  });

  render();
}
