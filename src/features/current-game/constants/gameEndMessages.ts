interface GameEndMessage {
  title: string;
  description: string;
}

const draw = (description: string): GameEndMessage => ({ title: "Draw", description });

export const getGameEndMessage = (
  reason: string,
  isWinner: boolean,
  isDraw: boolean = false
): GameEndMessage | null => {
  const messages: Record<string, GameEndMessage> = {
    resignation: {
      title: isWinner ? "You won by resignation" : "You resigned",
      description: isWinner ? "Your opponent resigned." : "The game has ended.",
    },
    draw_agreement: {
      title: "Draw agreed",
      description: "The game ended in a draw.",
    },
    aborted: {
      title: "Game aborted",
      description: "The game has been aborted.",
    },
    checkmate: {
      title: isWinner ? "You won by checkmate" : "Checkmate",
      description: isWinner ? "Well played." : "You lost the game.",
    },
    timeout: {
      title: isWinner ? "You won on time" : "Time's up",
      description: isWinner
        ? "Your opponent ran out of time."
        : "You ran out of time.",
    },
    timeout_vs_insufficient_material: draw(
      "Time ran out, but the other side had no way to checkmate."
    ),
    stalemate: draw("Stalemate: no legal moves, but not in check."),
    threefold_repetition: draw("The same position occurred three times."),
    insufficient_material: draw("Neither side has enough material to checkmate."),
    fifty_move_rule: draw("50 moves without a capture or pawn move."),
  };

  const message = messages[reason];
  if (!message && isDraw) return draw("The game ended in a draw.");
  return message ?? null;
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
