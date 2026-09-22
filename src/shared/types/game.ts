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
