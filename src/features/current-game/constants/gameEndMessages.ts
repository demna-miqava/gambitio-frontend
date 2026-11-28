interface GameEndMessage {
  title: string;
  description: string;
}

export type GameOutcomeKind = "win" | "loss" | "draw" | "aborted";

/** A player's own result: the kind sets the result block's colour */
export interface PlayerEndMessage extends GameEndMessage {
  kind: GameOutcomeKind;
}

/** How a decisive game ended, as the line under "You won" / "ann won" */
const DECISIVE: Record<string, (won: boolean, opponent: string) => string> = {
  checkmate: () => "by checkmate",
  resignation: (won, opponent) => (won ? `${opponent} resigned` : "You resigned"),
  timeout: () => "on time",
  // The winner claimed the game after the other player stayed away from it
  abandonment: (won, opponent) => (won ? `${opponent} left the game` : "You left the game"),
};

/** How a draw came about, as the line under "Draw" */
const DRAWN: Record<string, string> = {
  draw_agreement: "by agreement",
  timeout_vs_insufficient_material: "Time ran out, but the other side had no way to checkmate",
  stalemate: "by stalemate",
  threefold_repetition: "by repetition",
  insufficient_material: "by insufficient material",
  fifty_move_rule: "by the fifty-move rule",
};

/**
 * The result as told to the player: a short headline ("You won", "ann won",
 * "Draw", "Game aborted") and how it came about ("by checkmate"). The
 * description has no full stop: the rating line follows it.
 */
export const getGameEndMessage = (
  reason: string,
  isWinner: boolean,
  isDraw: boolean = false,
  opponentName: string = "Your opponent"
): PlayerEndMessage | null => {
  if (reason === "aborted") {
    return { kind: "aborted", title: "Game aborted", description: "No rating change" };
  }
  if (isDraw || reason in DRAWN) {
    return { kind: "draw", title: "Draw", description: DRAWN[reason] ?? "The game ended in a draw" };
  }
  const how = DECISIVE[reason];
  if (!how) return null;
  return {
    kind: isWinner ? "win" : "loss",
    title: isWinner ? "You won" : `${opponentName} won`,
    description: how(isWinner, opponentName),
  };
};

const DRAW_DESCRIPTIONS: Record<string, string> = {
  draw_agreement: "The players agreed to a draw.",
  timeout_vs_insufficient_material:
    "Time ran out, but the other side had no way to checkmate.",
  stalemate: "Stalemate: no legal moves, but not in check.",
  threefold_repetition: "The same position occurred three times.",
  insufficient_material: "Neither side has enough material to checkmate.",
  fifty_move_rule: "50 moves without a capture or pawn move.",
};

/**
 * The result as told to someone watching: who won and how, by name. `result`
 * is the server's ("white_win", "black_win", "draw", "aborted").
 */
export const getSpectatorEndMessage = (
  result: string | null | undefined,
  reason: string | null | undefined,
  whiteName: string,
  blackName: string
): GameEndMessage => {
  if (result === "aborted" || reason === "aborted") {
    return {
      title: "Game aborted",
      description: "The game ended before both players moved.",
    };
  }
  if (result === "white_win" || result === "black_win") {
    const whiteWon = result === "white_win";
    const winner = whiteWon ? whiteName : blackName;
    const loser = whiteWon ? blackName : whiteName;
    const descriptions: Record<string, string> = {
      checkmate: `${winner} won by checkmate.`,
      resignation: `${loser} resigned.`,
      timeout: `${loser} ran out of time.`,
      abandonment: `${loser} left the game.`,
    };
    return {
      title: `${winner} won`,
      description: (reason && descriptions[reason]) || "The game is over.",
    };
  }
  return {
    title: reason === "draw_agreement" ? "Draw agreed" : "Draw",
    description: (reason && DRAW_DESCRIPTIONS[reason]) || "The game ended in a draw.",
  };
};
