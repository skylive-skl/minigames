export type CategorySlug = 'all' | 'puzzle' | 'card' | 'match' | 'farm' | 'strategy' | 'arcade';

export interface Category {
  readonly slug: CategorySlug;
  readonly label: string;
  readonly isDefault: boolean;
}

export interface Game {
  readonly slug: string;
  readonly name: string;
  readonly category: Exclude<CategorySlug, 'all'>;
  readonly price: string;
  readonly shortDescription: string;
  readonly rating: number;
  readonly likesCount: number;
  readonly cardImage: string;
  readonly featured: boolean;
}

export interface GameSpecs {
  readonly genre: string;
  readonly players: string;
  readonly duration: string;
  readonly price: string;
}

export interface TopRecord {
  readonly position: number;
  readonly playerName: string;
  readonly score: number;
  readonly achievedAt: string;
}

export interface GameDetails {
  readonly slug: string;
  readonly name: string;
  readonly heroImage: string;
  readonly rating: number;
  readonly likesCount: number;
  readonly isLikedByCurrentUser: boolean;
  readonly fullDescription: string;
  readonly specs: GameSpecs;
  readonly topRecords: readonly TopRecord[];
}

export interface GameComment {
  readonly commentId: string;
  readonly authorName: string;
  readonly text: string;
  readonly likesCount: number;
  readonly isLikedByCurrentUser: boolean;
  readonly createdAt: string;
}
