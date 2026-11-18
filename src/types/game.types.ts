export type TimeControlType = "bullet" | "blitz" | "rapid";
export type GameStatus = "in_progress" | "finished";

export type GamePlayerInfo = {
  id: number;
  username: string;
  rating: number;
  /** The rating was still settling when the game started: shown as "1500?" */
  provisional?: boolean;
  avatarUrl: string | null;
  ratingChange: number | null;
};

export type GameResult = "white_win" | "black_win" | "draw" | "aborted";

export type Game = {
  id: number;
  createdAt: Date;
  pgn: string | null;
  fen: string | null;
  winnerId: number | null;
  numMoves: number;
  time: number;
  increment: number;
  /**
   * Each side's starting clock in seconds when they differ (time odds);
   * `time` is then the longer one. Null or missing for an even game.
   */
  whiteTime?: number | null;
  blackTime?: number | null;
  /** False for games that don't change ratings (time odds) */
  rated?: boolean;
  type: TimeControlType;
  status: GameStatus;
  result: GameResult | null;
  endReason: string | null;
  whitePlayer: GamePlayerInfo;
  blackPlayer: GamePlayerInfo;
  /** The friend series this game belongs to, if any */
  seriesId?: number | null;
  seriesGame?: number | null;
  /** The arena tournament that paired the game, if any */
  tournamentId?: number | null;
};

/** A player in a stored game; the computer in a bot game has no id */
export type StoredGamePlayer = Omit<GamePlayerInfo, "id"> & { id: number | null };

/**
 * A game as GET /games/:id returns it (the game history leaves out pgn and
 * fen: see StoredGameListItem). Besides games
 * between two players (a Game) this includes finished games against a
 * computer bot: unrated, untimed, and with no user on the bot's side. See
 * isPlayerGame in utils/storedGame.
 */
export type StoredGame = Omit<Game, "time" | "type" | "whitePlayer" | "blackPlayer"> & {
  /** Null for bot games, which are untimed */
  time: number | null;
  type: TimeControlType | null;
  /** False for bot games and games with time odds: they don't change ratings */
  rated: boolean;
  /** The computer opponent (play-bots BOTS id) in a bot game */
  botId: string | null;
  /** The friend series this game belongs to (see features/series) */
  seriesId?: number | null;
  /** 1-based number of the game in its series */
  seriesGame?: number | null;
  whitePlayer: StoredGamePlayer;
  blackPlayer: StoredGamePlayer;
};

/** A row of the game history: no move list or position (GET /games/:id has those). */
export type StoredGameListItem = Omit<StoredGame, "pgn" | "fen">;

export type PaginatedGamesResponse = {
  data: StoredGameListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type GetUserGamesParams = {
  userId: number;
  page?: number;
  limit?: number;
};

export type PlayerColorOption = "white" | "black" | "random";
