import { Chess, type Move } from "chess.js";

/**
 * Calculate first: the player enters a puzzle's whole line (their moves and
 * the opponent's replies) on a board that stays on the starting position.
 * These helpers follow the entered line on a hidden chess.js position, so
 * illegal moves are refused, and judge it against the solution once it is
 * submitted. The solution is in UCI with the player's moves at even indexes
 * (the puzzle's FEN has the player to move).
 */

/** Plays a UCI move; chess.js v1 throws on illegal moves, null instead. */
export const playUci = (chess: Chess, uci: string): Move | null => {
  try {
    return chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      ...(uci[4] ? { promotion: uci[4] } : {}),
    });
  } catch {
    return null;
  }
};

export const toUci = (move: Pick<Move, "from" | "to" | "promotion">) =>
  move.from + move.to + (move.promotion ?? "");

/** How many of their own moves the player has to find. */
export const playerMoveCount = (solution: readonly string[]) => Math.ceil(solution.length / 2);

/** Index of a move in the line belongs to the player (they move first). */
export const isPlayerIndex = (index: number) => index % 2 === 0;

/**
 * The hidden position after `entered` (null if a move doesn't apply, which
 * entry never lets happen), and the entered moves in SAN.
 */
export const followLine = (fen: string, entered: readonly string[]) => {
  const chess = new Chess();
  try {
    chess.load(fen);
  } catch {
    return null;
  }
  const moves: Move[] = [];
  for (const uci of entered) {
    const move = playUci(chess, uci);
    if (!move) return null;
    moves.push(move);
  }
  return { chess, moves };
};

export type AppendRefusal = "illegal" | "full" | "over";

/**
 * Adds a move to the entered line if it is legal in the hidden position and
 * the line has room: no more moves than the solution, nothing after mate.
 */
export const appendMove = (
  fen: string,
  entered: readonly string[],
  solutionLength: number,
  move: { from: string; to: string; promotion?: string }
): { line: string[]; san: string } | { refused: AppendRefusal } => {
  if (entered.length >= solutionLength) return { refused: "full" };
  const followed = followLine(fen, entered);
  if (!followed) return { refused: "illegal" };
  if (followed.chess.isGameOver()) return { refused: "over" };
  const played = playUci(followed.chess, move.from + move.to + (move.promotion ?? ""));
  if (!played) return { refused: "illegal" };
  return { line: [...entered, toUci(played)], san: played.san };
};

/**
 * Submit is allowed once the player's last move is in: the line is as long
 * as the solution, or a move of the player's ended it with mate.
 */
export const isLineComplete = (fen: string, entered: readonly string[], solutionLength: number) => {
  if (entered.length === 0 || !isPlayerIndex(entered.length - 1)) return false;
  if (entered.length === solutionLength) return true;
  const followed = followLine(fen, entered);
  return !!followed && followed.chess.isCheckmate();
};

export type LineVerdict =
  /** Every move of the player's matched (or a move of theirs mated) */
  | { result: "solved" }
  /** The player's move at `index` was wrong */
  | { result: "failed"; index: number }
  /**
   * The player's moves were right up to `index`, a reply they predicted
   * differently: the solution is played up to and including the real reply
   * at `index`, and the player finishes from `index + 1` move by move.
   */
  | { result: "reply-differs"; index: number };

/**
 * Judges a complete entered line against the solution. A move of the
 * player's that mates counts as right even when it isn't the listed one,
 * as in the other modes.
 */
export const judgeLine = (fen: string, solution: readonly string[], entered: readonly string[]): LineVerdict => {
  const followed = followLine(fen, entered);
  // Entry only builds legal lines; anything else is a miss on the first move
  if (!followed) return { result: "failed", index: 0 };
  for (let i = 0; i < entered.length; i++) {
    if (entered[i] === solution[i]) continue;
    if (!isPlayerIndex(i)) return { result: "reply-differs", index: i };
    // A mating move ends the line (nothing can follow it), so it's the last
    const mates = i === entered.length - 1 && followed.moves[i]?.san.endsWith("#");
    return mates ? { result: "solved" } : { result: "failed", index: i };
  }
  return entered.length >= solution.length ? { result: "solved" } : { result: "failed", index: entered.length };
};

/** SAN of a line from the puzzle's position (as far as it applies). */
export const lineToSan = (fen: string, line: readonly string[]): string[] => {
  const chess = new Chess();
  try {
    chess.load(fen);
  } catch {
    return [];
  }
  const sans: string[] = [];
  for (const uci of line) {
    const move = playUci(chess, uci);
    if (!move) break;
    sans.push(move.san);
  }
  return sans;
};

/** Move labels like "1. Nf3", "1... Nc6", following the FEN's move number. */
export const moveLabels = (fen: string, count: number): string[] => {
  const [, turn = "w", , , , fullmove = "1"] = fen.split(" ");
  let number = Number.parseInt(fullmove, 10) || 1;
  let white = turn === "w";
  const labels: string[] = [];
  for (let i = 0; i < count; i++) {
    labels.push(white ? `${number}.` : `${number}...`);
    if (!white) number++;
    white = !white;
  }
  return labels;
};
