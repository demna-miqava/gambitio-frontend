export const ROUTES = {
  HOME: "/home",
  PUZZLES: "/puzzles",
  PUZZLE_MODE: "/puzzles/:mode",
  /** Puzzle duels: invites (the lobby), and a duel being played */
  PUZZLE_DUEL: "/puzzles/duel",
  PUZZLE_DUEL_GAME: "/puzzles/duel/:duelId",
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
  /** Coordinates trainer: click the named square */
  COORDINATES: "/coordinates",
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
    /** Set up any position (?fen=) */
    BOARD_EDITOR: "/editor",
  },
  LANDING: "/",
} as const;

// Helper functions for dynamic routes
export const getPuzzleModeRoute = (mode: "infinite" | "rush" | "survival" | "calculate") =>
  `/puzzles/${mode}`;
export const getPuzzleDuelRoute = (duelId: number) => `/puzzles/duel/${duelId}`;
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
/** Query param holding a set-up position (board editor, analysis board, bots) */
export const FEN_PARAM = "fen";
export const getBoardEditorRoute = (fen?: string) =>
  fen ? `/editor?${FEN_PARAM}=${encodeURIComponent(fen)}` : "/editor";
/** The analysis board starting from a set-up position */
export const getAnalysisFromPositionRoute = (fen: string) =>
  `/analysis?${FEN_PARAM}=${encodeURIComponent(fen)}`;
/** Play the computer from a set-up position (the game isn't saved) */
export const getPlayBotsFromPositionRoute = (fen: string) =>
  `/play-bots?${FEN_PARAM}=${encodeURIComponent(fen)}`;
export const getProfileRoute = (id: number) => `/profile/${id}`;
export const getProfileGamesRoute = (id: number) => `/profile/${id}/games`;
export const getProfileStatsRoute = (id: number) => `/profile/${id}/stats`;
export const getProfileFriendsRoute = (id: number) => `/profile/${id}/friends`;
