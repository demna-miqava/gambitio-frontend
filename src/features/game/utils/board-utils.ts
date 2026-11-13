import type { Chess } from "chess.js";
import type { Api } from "@lichess-org/chessground/api";
import type { Key } from "@lichess-org/chessground/types";
import type { PlayerColor } from "../types/game.types";

/**
 * Calculate legal moves for all pieces on the board
 */
export const calculateLegalMoves = (chess: Chess): Map<Key, Key[]> => {
  const dests = new Map<Key, Set<Key>>();

  // chess.js squares ("e4") are valid Chessground keys
  for (const move of chess.moves({ verbose: true })) {
    const set = dests.get(move.from) ?? new Set<Key>();
    set.add(move.to);
    dests.set(move.from, set);
  }

  const result = new Map<Key, Key[]>();
  dests.forEach((set, from) => {
    result.set(from, Array.from(set));
  });
  return result;
};

/**
 * Get turn color from chess instance
 */
export const getTurnColor = (chess: Chess): PlayerColor => {
  return chess.turn() === "w" ? "white" : "black";
};

/** From/to squares of the last move played, for the board's highlight. */
export const getLastMove = (chess: Chess): [Key, Key] | undefined => {
  const history = chess.history({ verbose: true });
  const last = history[history.length - 1];
  return last ? [last.from, last.to] : undefined;
};

export interface SyncBoardOptions {
  cg: Api;
  chess: Chess;
  /** Who may move; undefined locks the board (game over, disconnected) */
  movableColor: PlayerColor | "both" | undefined;
  /**
   * Highlighted last move. Leave the key out to keep the board's current
   * highlight; pass undefined to clear it.
   */
  lastMove?: [Key, Key] | undefined;
  playPremove?: boolean;
}

/**
 * Synchronize the chessground board state with the chess.js instance.
 * Returns the current turn color.
 */
export const syncBoard = (options: SyncBoardOptions): PlayerColor => {
  const { cg, chess, movableColor, playPremove = false } = options;
  const turn = getTurnColor(chess);

  const dests =
    movableColor === "both" || (movableColor !== undefined && turn === movableColor)
      ? calculateLegalMoves(chess)
      : new Map();

  cg.set({
    fen: chess.fen(),
    turnColor: turn,
    movable: {
      color: movableColor,
      dests,
    },
    check: chess.inCheck(),
    // Chessground clears the highlight when the key is present but undefined
    ...("lastMove" in options && { lastMove: options.lastMove }),
  });

  if (
    playPremove &&
    movableColor !== "both" &&
    movableColor !== undefined &&
    turn === movableColor
  ) {
    cg.playPremove();
  }

  return turn;
};
