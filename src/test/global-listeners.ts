import { afterEach, beforeEach } from 'vitest';

interface TrackedListener {
  readonly remove: () => void;
}

type ListenerArguments = [
  type: string,
  listener: EventListenerOrEventListenerObject | null,
  options?: boolean | AddEventListenerOptions,
];

const eventTargetPrototype = EventTarget.prototype;
const nativeAddEventListener: unknown = Reflect.get(eventTargetPrototype, 'addEventListener');
// Vitest copies window methods onto globalThis already bound to jsdom's
// window, so globalThis.addEventListener bypasses the prototype.
const globalAddEventListener: unknown = Reflect.get(globalThis, 'addEventListener');

function callNative(method: unknown, target: unknown, parameters: ListenerArguments): void {
  if (typeof method === 'function') {
    Reflect.apply(method, target, parameters);
  }
}

// Apps booted in a test attach listeners to document/window, which outlive
// the test. Recording them lets each test start without the previous app.
// Methods are patched by hand (not vi.spyOn) so restoreMocks cannot drop the
// tracker halfway through a test.
export function removeGlobalListenersAfterEach(): void {
  const tracked: TrackedListener[] = [];

  function track(target: EventTarget, parameters: ListenerArguments): void {
    const [type, listener, options] = parameters;
    if (listener !== null) {
      tracked.push({
        remove: () => {
          target.removeEventListener(type, listener, options);
        },
      });
    }
  }

  function trackingAddEventListener(this: EventTarget, ...parameters: ListenerArguments): void {
    if (this === document) {
      track(this, parameters);
    }
    callNative(nativeAddEventListener, this, parameters);
  }

  function trackingGlobalAddEventListener(...parameters: ListenerArguments): void {
    track(globalThis, parameters);
    callNative(globalAddEventListener, globalThis, parameters);
  }

  beforeEach(() => {
    Reflect.set(eventTargetPrototype, 'addEventListener', trackingAddEventListener);
    Reflect.set(globalThis, 'addEventListener', trackingGlobalAddEventListener);
  });

  afterEach(() => {
    Reflect.set(eventTargetPrototype, 'addEventListener', nativeAddEventListener);
    Reflect.set(globalThis, 'addEventListener', globalAddEventListener);
    for (const listener of tracked.splice(0)) {
      listener.remove();
    }
  });
}
