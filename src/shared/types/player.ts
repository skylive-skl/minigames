export interface LeaderboardEntry {
  readonly rank: number;
  readonly playerName: string;
  readonly gamesPlayed: number;
  readonly totalScore: number;
  readonly streakDays: number;
  readonly favoriteGameSlug: string;
  readonly favoriteGameName: string;
}
