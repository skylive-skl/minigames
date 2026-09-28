// Truncates rather than rounds (28750 -> "28.7K", not "28.8K") to match the
// mockup's displayed values (design-refs/home-*.png, New Games card overlay).
export function formatCompactNumber(value: number): string {
  if (value < 1000) {
    return String(value);
  }

  const truncatedTenths = Math.trunc(value / 100);

  return `${String(truncatedTenths / 10)}K`;
}

export function formatThousands(value: number): string {
  return value.toLocaleString('en-US');
}

export function formatStreakDays(days: number): string {
  return days === 1 ? '1 day' : `${String(days)} days`;
}

export function formatStreakDaysCompact(days: number): string {
  return `${String(days)}d`;
}

const RELATIVE_TIME_UNITS: readonly (readonly [Intl.RelativeTimeFormatUnit, number])[] = [
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['week', 7 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
];

const relativeTimeFormatter = new Intl.RelativeTimeFormat('en-US', { numeric: 'always' });

// "3 hours ago", "1 week ago" — matches the Game Details mockup labels.
export function formatRelativeTime(isoString: string, now: Date = new Date()): string {
  const timestamp = new Date(isoString).getTime();

  if (Number.isNaN(timestamp)) {
    return isoString;
  }

  const elapsedSeconds = Math.max(0, Math.round((now.getTime() - timestamp) / 1000));

  for (const [unit, unitSeconds] of RELATIVE_TIME_UNITS) {
    if (elapsedSeconds >= unitSeconds) {
      return relativeTimeFormatter.format(-Math.floor(elapsedSeconds / unitSeconds), unit);
    }
  }

  return 'just now';
}
