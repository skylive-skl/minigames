import { afterEach, vi } from 'vitest';

// jsdom reflects <dialog open> but has no show/showModal/close: emulate them
// and the "close" event so components can be driven the same way a browser does.
function polyfillDialog(): void {
  const dialogPrototype = HTMLDialogElement.prototype;

  dialogPrototype.show = function show(this: HTMLDialogElement): void {
    this.setAttribute('open', '');
  };

  dialogPrototype.showModal = function showModal(this: HTMLDialogElement): void {
    this.setAttribute('open', '');
  };

  dialogPrototype.close = function close(this: HTMLDialogElement, returnValue?: string): void {
    if (!this.hasAttribute('open')) {
      return;
    }
    if (returnValue !== undefined) {
      this.returnValue = returnValue;
    }
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

// The Popover API is missing in jsdom; the snackbar region only needs the
// calls to exist.
function polyfillPopover(): void {
  HTMLElement.prototype.showPopover = function showPopover(): void {
    // No top layer in jsdom.
  };
  HTMLElement.prototype.hidePopover = function hidePopover(): void {
    // No top layer in jsdom.
  };
}

// Only the members the app reads; defineProperty keeps jsdom's window typing intact.
type MediaQueryListStub = Pick<
  MediaQueryList,
  'matches' | 'media' | 'addEventListener' | 'removeEventListener'
>;

function createMediaQueryList(query: string): MediaQueryListStub {
  return {
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}

polyfillDialog();
polyfillPopover();

Object.defineProperties(globalThis, {
  matchMedia: { configurable: true, value: createMediaQueryList },
  // jsdom implements scrollTo as a "not implemented" error log.
  scrollTo: {
    configurable: true,
    value: (): void => {
      // Layout does not exist in jsdom.
    },
  },
});

afterEach(() => {
  document.body.replaceChildren();
  document.body.removeAttribute('style');
  localStorage.clear();
  globalThis.history.replaceState(undefined, '', import.meta.env.BASE_URL);
});
