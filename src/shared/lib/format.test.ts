import { describe, expect, it } from 'vitest';
import {
  formatCompactNumber,
  formatRelativeTime,
  formatStreakDays,
  formatStreakDaysCompact,
  formatThousands,
} from './format';

describe('formatCompactNumber', () => {
  it('keeps values below one thousand as is', () => {
    expect(formatCompactNumber(0)).toBe('0');
    expect(formatCompactNumber(999)).toBe('999');
  });

  it('truncates thousands to one decimal instead of rounding', () => {
    expect(formatCompactNumber(1000)).toBe('1K');
    expect(formatCompactNumber(28_750)).toBe('28.7K');
    expect(formatCompactNumber(31_201)).toBe('31.2K');
  });
});

describe('formatThousands', () => {
  it('groups digits with commas', () => {
    expect(formatThousands(1_234_567)).toBe('1,234,567');
    expect(formatThousands(42)).toBe('42');
  });
});

describe('streak formatting', () => {
  it('uses the singular form for exactly one day', () => {
    expect(formatStreakDays(1)).toBe('1 day');
    expect(formatStreakDays(12)).toBe('12 days');
  });

  it('renders the compact form with a "d" suffix', () => {
    expect(formatStreakDaysCompact(7)).toBe('7d');
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2026-10-12T12:00:00Z');
  const ago = (seconds: number): string => new Date(now.getTime() - seconds * 1000).toISOString();

  const MINUTE = 60;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  it.each([
    [0, 'just now'],
    [59, 'just now'],
    [MINUTE, '1 min ago'],
    [59 * MINUTE, '59 min ago'],
    [HOUR, '1 hour ago'],
    [5 * HOUR, '5 hours ago'],
    [DAY, '1 day ago'],
    [6 * DAY, '6 days ago'],
    [7 * DAY, '1 week ago'],
    [27 * DAY, '3 weeks ago'],
    [28 * DAY, '1 month ago'],
    [65 * DAY, '2 months ago'],
    [362 * DAY, '11 months ago'],
    [365 * DAY, '1 year ago'],
    [3 * 365 * DAY, '3 years ago'],
  ])('formats %i seconds ago as "%s"', (seconds, expected) => {
    expect(formatRelativeTime(ago(seconds), now)).toBe(expected);
  });

  it('treats future timestamps as "just now"', () => {
    expect(formatRelativeTime(ago(-HOUR), now)).toBe('just now');
  });

  it('returns the original string when it is not a valid date', () => {
    expect(formatRelativeTime('not-a-date', now)).toBe('not-a-date');
  });
});
