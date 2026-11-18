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
}

export interface Stats extends Record<string, GameStats> {
  bullet: GameStats;
  blitz: GameStats;
  rapid: GameStats;
}
