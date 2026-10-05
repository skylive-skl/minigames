// The API returns image paths the backend does not serve, so covers are
// resolved from local assets by game slug.
const GAME_IMAGES_DIRECTORY = '/src/assets/images/games';

const gameImageModules = import.meta.glob<string>('/src/assets/images/games/*.jpg', {
  eager: true,
  import: 'default',
});

export type GameImageVariant = 'card' | 'hero';

export function getGameImageUrl(slug: string, variant: GameImageVariant): string {
  const path = `${GAME_IMAGES_DIRECTORY}/${slug}-${variant}.jpg`;

  if (Object.hasOwn(gameImageModules, path)) {
    return gameImageModules[path] ?? '';
  }

  // A hero cover can fall back to the card cover of the same game.
  return variant === 'hero' ? getGameImageUrl(slug, 'card') : '';
}
