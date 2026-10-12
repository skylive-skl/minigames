import type { Category, Game } from '@/shared/types/game';

// Shared test data shaped like real API responses.
export function createGame(overrides: Partial<Game> = {}): Game {
  return {
    slug: 'tiny-glade',
    name: 'Tiny Glade',
    category: 'puzzle',
    price: 'Free',
    shortDescription: 'Build cozy castles.',
    rating: 4.8,
    likesCount: 28_750,
    cardImage: '',
    ...overrides,
  };
}

export const CATEGORIES: readonly Category[] = [
  { slug: 'all', label: 'All Games', isDefault: true },
  { slug: 'puzzle', label: 'Puzzle', isDefault: false },
  { slug: 'card', label: 'Card', isDefault: false },
];
