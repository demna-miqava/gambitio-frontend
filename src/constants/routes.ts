export const ROUTES = {
  HOME: "/home",
  PUZZLES: "/puzzles",
  PUZZLE_MODE: "/puzzles/:mode",
  PLAY: "/play",
  PLAY_BOTS: "/play-bots",
  BOT_GAME: "/bot-game",
  /** Table mode: set up a game at a real board, and play it */
  TABLE: "/table",
  TABLE_GAME: "/table/play",
  SETTINGS: "/settings",
  GAME: "/game/:gameId",
  ARCHIVE_GAME: "/archive/:gameId",
  /** A game someone shared: open to everyone, signed in or not */
  SHARED_GAME: "/share/:token",
  WATCH: "/watch",
  LEADERBOARD: "/leaderboard",
  SERIES: "/series/:seriesId",
  REPERTOIRE: "/repertoire",
  STUDY: "/study",
  STUDY_ROOM: "/study/:roomId",
  TOURNAMENTS: "/tournaments",
  TOURNAMENT: "/tournaments/:tournamentId",
  ENDGAMES: "/endgames",
  ENDGAME_EXERCISE: "/endgames/:exerciseId",
  CONVERSION_DRILLS: "/drills",
  CONVERSION_DRILL: "/drills/:drillId",
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
export const getPuzzleModeRoute = (mode: "infinite" | "rush" | "survival" | "calculate") =>
  `/puzzles/${mode}`;
export const getGameRoute = (gameId: string | number) => `/game/${gameId}`;
export const getArchiveGameRoute = (gameId: string | number) => `/archive/${gameId}`;
/** Query param that starts the computer review as soon as the game page opens */
export const REVIEW_PARAM = "review";
/** The archived game with the computer review started */
export const getGameReviewRoute = (gameId: string | number) =>
  `/archive/${gameId}?${REVIEW_PARAM}=1`;
export const getSharedGameRoute = (token: string) => `/share/${token}`;
export const getTournamentRoute = (tournamentId: number) => `/tournaments/${tournamentId}`;
export const getSeriesRoute = (seriesId: number) => `/series/${seriesId}`;
export const getStudyRoomRoute = (roomId: number) => `/study/${roomId}`;
export const getEndgameExerciseRoute = (exerciseId: string) => `/endgames/${exerciseId}`;
export const getConversionDrillRoute = (drillId: number) => `/drills/${drillId}`;
export const getProfileRoute = (id: number) => `/profile/${id}`;
export const getProfileGamesRoute = (id: number) => `/profile/${id}/games`;
export const getProfileStatsRoute = (id: number) => `/profile/${id}/stats`;
export const getProfileFriendsRoute = (id: number) => `/profile/${id}/friends`;
