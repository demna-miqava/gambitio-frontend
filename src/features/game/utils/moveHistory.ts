import type { Chess, Move } from "chess.js";
import type { Key } from "@lichess-org/chessground/types";

/**
 * The game's moves (chess.js verbose history) together with the position
 * they lead to. `chess.history()` replays the whole game, generating the
 * legal moves at every ply, so the board keeps one copy and reuses it until
 * the game changes.
 */
export interface MoveHistory {
  /** FEN of the position after the last move, when the moves were read */
  fen: string;
  moves: Move[];
}

/** Reads every move from the game (one full replay). */
export const readHistory = (chess: Chess): MoveHistory => ({
  fen: chess.fen(),
  moves: chess.history({ verbose: true }),
});

/** Same line of moves: each move leads to the same position, from the same start */
export const sameMoves = (a: readonly Move[], b: readonly Move[]): boolean =>
  a.length === b.length &&
  (a.length === 0 || a[0].before === b[0].before) &&
  a.every((move, i) => move.after === b[i].after);

/**
 * The history after the game changed. `appended` is the move just played
 * on top of `prev` (from chess.move()): if it continues prev's position and
 * reaches the game's position, it's added without a replay. Anything else
 * (a resync, a takeback, a loaded PGN) replays the game once. An unchanged
 * line keeps prev's array, so nothing re-renders for it.
 */
export const nextHistory = (
  chess: Chess,
  prev: MoveHistory,
  appended?: Move
): MoveHistory => {
  const fen = chess.fen();
  if (appended && appended.before === prev.fen && appended.after === fen) {
    return { fen, moves: [...prev.moves, appended] };
  }
  const moves = chess.history({ verbose: true });
  return { fen, moves: sameMoves(moves, prev.moves) ? prev.moves : moves };
};

/**
 * The cached history if the game is still at its position, else a fresh
 * read. A safety net for code that changed the game without recording it.
 */
export const currentHistory = (chess: Chess, cache: MoveHistory): MoveHistory =>
  chess.fen() === cache.fen ? cache : readHistory(chess);

/** From/to squares of the last move, for the board's highlight. */
export const lastMoveSquares = (moves: readonly Move[]): [Key, Key] | undefined => {
  const last = moves[moves.length - 1];
  return last ? [last.from, last.to] : undefined;
};

/** FEN of the position after `count` moves (0 = the start), or undefined with no moves. */
export const fenAfter = (moves: readonly Move[], count: number): string | undefined =>
  count <= 0 ? moves[0]?.before : moves[Math.min(count, moves.length) - 1]?.after;
