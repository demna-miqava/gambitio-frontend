import { Chess } from "chess.js";

/**
 * Replaces the game with the server's (its PGN, "" for no moves yet), all
 * or nothing. chess.js loadPgn isn't: it resets the game and plays the
 * moves one by one, so a bad move throws with the game half loaded and out
 * of step with the move list. The PGN is tried on a scratch game first and
 * only then loaded into `chess` (loadPgn, not load(fen): the moves are the
 * history the list and the board's highlight read). Returns false, with
 * `chess` untouched, if it doesn't load.
 */
export const loadServerPgn = (chess: Chess, pgn: string): boolean => {
  if (!pgn) {
    chess.reset();
    return true;
  }
  try {
    new Chess().loadPgn(pgn);
  } catch {
    return false;
  }
  // Same input, same result: this can't fail once the dry run passed
  chess.loadPgn(pgn);
  return true;
};
