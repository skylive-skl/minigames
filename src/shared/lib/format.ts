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
