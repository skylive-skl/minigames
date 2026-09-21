// Truncates rather than rounds (28750 -> "28.7K", not "28.8K") to match the
// mockup's displayed values (design-refs/home-*.png, New Games card overlay).
export function formatCompactNumber(value: number): string {
  if (value < 1000) {
    return String(value);
  }

  const truncatedTenths = Math.trunc(value / 100);

  return `${String(truncatedTenths / 10)}K`;
}
