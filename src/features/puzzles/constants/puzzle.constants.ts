export const PUZZLE_CONFIG = {
  RUSH: {
    DURATION_SECONDS: 180,
    /** How often the clock re-reads the time; display is whole seconds */
    TIMER_INTERVAL_MS: 250,
    /** 3-2-1 before the clock starts */
    COUNTDOWN_SECONDS: 3,
    /** Wrong moves that end a run */
    MAX_STRIKES: 3,
    /** localStorage key of the best score */
    BEST_STORAGE_KEY: "gambitio:puzzle-rush-best",
  },
  SURVIVAL: {
    INITIAL_LIVES: 3,
  },
  CALCULATE: {
    /** Survival's rules: three lives, no clock */
    INITIAL_LIVES: 3,
    /** localStorage key of the best score */
    BEST_STORAGE_KEY: "gambitio:puzzle-calculate-best",
    /** Between moves when a submitted line is played out on the board */
    REPLAY_MOVE_MS: 550,
    /** After a solved line has played out, before the next puzzle */
    NEXT_AFTER_SOLVE_MS: 900,
  },
  /**
   * Timed modes: how long a wrong move stays marked on the board before the
   * next puzzle loads
   */
  WRONG_MOVE_ADVANCE_MS: 700,
  PREFETCH: {
    THRESHOLD: 2,
    MAX_PAGES: 2,
  },
} as const;

export const PUZZLE_QUERY_KEY = "puzzles";
export const PUZZLE_THEMES_QUERY_KEY = "puzzle-themes";

export const PUZZLE_MESSAGES = {
  LOADING_MORE: "Loading more puzzles...",
  NO_MORE: "No more puzzles available",
  LOAD_ERROR: "Failed to load puzzle",
  INVALID_DATA: "Invalid puzzle data received",
  ATTEMPT_ERROR: "Couldn't save your puzzle result",
} as const;
