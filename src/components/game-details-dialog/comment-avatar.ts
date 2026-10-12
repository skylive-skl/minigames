// The "avatar-random" design tokens (Figma guidebook "avatar bg" swatches).
export const AVATAR_RANDOM_COLORS: readonly string[] = [
  'var(--color-avatar-1)',
  'var(--color-avatar-2)',
  'var(--color-avatar-3)',
  'var(--color-avatar-4)',
  'var(--color-avatar-5)',
];

export type AvatarColorPicker = (authorName: string) => string;

// Picks a random token once per commenter and remembers it, so re-renders
// (new comment, like update) never repaint an existing avatar.
export function createAvatarColorPicker(random: () => number = Math.random): AvatarColorPicker {
  const colorsByAuthor = new Map<string, string>();

  return (authorName) => {
    const key = authorName.trim();
    const known = colorsByAuthor.get(key);

    if (known !== undefined) {
      return known;
    }

    const index = Math.floor(random() * AVATAR_RANDOM_COLORS.length) % AVATAR_RANDOM_COLORS.length;
    const color = AVATAR_RANDOM_COLORS[index];
    colorsByAuthor.set(key, color);
    return color;
  };
}

// First non-whitespace character, uppercased (a whole code point, so emoji
// and astral letters are not split).
export function getAvatarInitial(authorName: string): string {
  const codePoint = authorName.trim().codePointAt(0);
  return codePoint === undefined ? '' : String.fromCodePoint(codePoint).toUpperCase();
}
