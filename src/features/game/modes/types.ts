export const GAME_MODES = {
  LIVE: "live",
  ARCHIVE: "archive",
  ANALYSIS: "analysis",
  PUZZLE: "puzzle",
} as const;

export type GameModeId = (typeof GAME_MODES)[keyof typeof GAME_MODES];

export interface GameModeNavigation {
  goToStart: () => void;
  goToEnd: () => void;
  goBack: () => void;
  goForward: () => void;
  isAtStart: boolean;
  isAtEnd: boolean;
  currentIndex?: number;
  viewingIndex?: number | null;
  isViewingHistory?: boolean;
}
