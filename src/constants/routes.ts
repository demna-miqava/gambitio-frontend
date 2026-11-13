export const ROUTES = {
  HOME: "/home",
  PUZZLES: "/puzzles",
  PUZZLE_MODE: "/puzzles/:mode",
  PLAY: "/play",
  PLAY_BOTS: "/play-bots",
  BOT_GAME: "/bot-game",
  SETTINGS: "/settings",
  GAME: "/game/:gameId",
  ARCHIVE_GAME: "/archive/:gameId",
  WATCH: "/watch",
  LEADERBOARD: "/leaderboard",
  PROFILE: {
    ROOT: "/profile/:id",
    OVERVIEW: "",
    GAMES: "games",
    STATS: "stats",
    FRIENDS: "friends",
  },
  AUTH: {
    SIGN_IN: "/signin",
    SIGN_UP: "/signup",
    PROFILE_SETUP: "/profile-setup",
  },
  TOOLS: {
    IMPORT_GAME: "/import-game",
    ANALYSIS_BOARD: "/analysis",
  },
  LANDING: "/",
} as const;

// Helper functions for dynamic routes
export const getPuzzleModeRoute = (mode: "infinite" | "rush" | "survival") =>
  `/puzzles/${mode}`;
export const getGameRoute = (gameId: string | number) => `/game/${gameId}`;
export const getArchiveGameRoute = (gameId: string | number) => `/archive/${gameId}`;
/** Query param that starts the computer review as soon as the game page opens */
export const REVIEW_PARAM = "review";
/** The archived game with the computer review started */
export const getGameReviewRoute = (gameId: string | number) =>
  `/archive/${gameId}?${REVIEW_PARAM}=1`;
export const getProfileRoute = (id: number) => `/profile/${id}`;
export const getProfileGamesRoute = (id: number) => `/profile/${id}/games`;
export const getProfileStatsRoute = (id: number) => `/profile/${id}/stats`;
export const getProfileFriendsRoute = (id: number) => `/profile/${id}/friends`;
