import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { showSnackbar } from './snackbar';

// Matches the leave animation fallback inside the snackbar module.
const LEAVE_DELAY = 300;

function snackbars(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('.snackbar-region .snackbar')];
}

describe('showSnackbar', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the message as text in a polite live region', () => {
    showSnackbar({ message: '<b>Saved</b>', variant: 'success' });

    const [item] = snackbars();
    expect(item.textContent).toBe('<b>Saved</b>');
    expect(item.classList.contains('snackbar--success')).toBe(true);
    expect(item.getAttribute('role')).toBe('status');
    expect(document.querySelector('.snackbar-region')?.getAttribute('aria-live')).toBe('polite');
  });

  it('announces errors with role="alert" and defaults to the info variant', () => {
    showSnackbar({ message: 'Failed', variant: 'error' });
    showSnackbar({ message: 'Heads up' });

    const [error, info] = snackbars();
    expect(error.getAttribute('role')).toBe('alert');
    expect(info.classList.contains('snackbar--info')).toBe(true);
  });

  it('hides itself after the given duration', () => {
    showSnackbar({ message: 'Bye', duration: 1000 });

    vi.advanceTimersByTime(999);
    expect(snackbars()).toHaveLength(1);

    vi.advanceTimersByTime(1 + LEAVE_DELAY);
    expect(snackbars()).toHaveLength(0);
  });

  it('closes immediately from the dismiss button', () => {
    showSnackbar({ message: 'Dismiss me' });

    document.querySelector<HTMLButtonElement>('.snackbar__close')?.click();
    vi.advanceTimersByTime(LEAVE_DELAY);

    expect(snackbars()).toHaveLength(0);
  });

  it('keeps at most three notifications, dropping the oldest', () => {
    for (const message of ['one', 'two', 'three', 'four']) {
      showSnackbar({ message });
    }
    vi.advanceTimersByTime(LEAVE_DELAY);

    expect(snackbars().map((item) => item.textContent)).toEqual(['two', 'three', 'four']);
  });

  it('reuses a single region for every notification', () => {
    showSnackbar({ message: 'A' });
    showSnackbar({ message: 'B' });

    expect(document.querySelectorAll('.snackbar-region')).toHaveLength(1);
  });
});
