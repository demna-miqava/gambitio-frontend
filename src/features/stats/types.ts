export interface GameStats {
  rating: number;
  /** Still settling: shown with a "?" */
  provisional?: boolean;
  delta: number;
  highestRating: number;
  highestDate: string;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  /** The rating after each of the last few rated games, oldest first (absent from older servers) */
  recent?: number[];
}

export interface Stats extends Record<string, GameStats> {
  bullet: GameStats;
  blitz: GameStats;
  rapid: GameStats;
}
