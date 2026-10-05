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

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;
const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;
const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;
const MAX_WEEKS = 3;
const MAX_MONTHS = 11;

function pluralize(count: number, unit: string): string {
  return `${String(count)} ${unit}${count === 1 ? '' : 's'} ago`;
}

// Story 3 relative-time rules: "just now", "N min ago", hours, days (1–6),
// weeks (1–3), months (1–11), then full years.
export function formatRelativeTime(isoString: string, now: Date = new Date()): string {
  const timestamp = new Date(isoString).getTime();

  if (Number.isNaN(timestamp)) {
    return isoString;
  }

  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - timestamp) / 1000));

  if (elapsedSeconds < SECONDS_PER_MINUTE) {
    return 'just now';
  }

  if (elapsedSeconds < SECONDS_PER_HOUR) {
    return `${String(Math.floor(elapsedSeconds / SECONDS_PER_MINUTE))} min ago`;
  }

  if (elapsedSeconds < SECONDS_PER_DAY) {
    return pluralize(Math.floor(elapsedSeconds / SECONDS_PER_HOUR), 'hour');
  }

  const days = Math.floor(elapsedSeconds / SECONDS_PER_DAY);

  if (days < DAYS_PER_WEEK) {
    return pluralize(days, 'day');
  }

  const weeks = Math.floor(days / DAYS_PER_WEEK);

  if (weeks <= MAX_WEEKS) {
    return pluralize(weeks, 'week');
  }

  if (days < DAYS_PER_YEAR) {
    // Days 28–29 still round down to 0 months, and 360–364 to 12: clamp both.
    const months = Math.min(MAX_MONTHS, Math.max(1, Math.floor(days / DAYS_PER_MONTH)));
    return pluralize(months, 'month');
  }

  return pluralize(Math.floor(days / DAYS_PER_YEAR), 'year');
}
