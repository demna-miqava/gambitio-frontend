import type { RepertoireGameCheck } from "@/services/repertoire";

export interface CheckSummary {
  total: number;
  followed: number;
  youDeviated: number;
  opponentDeviated: number;
  notCovered: number;
}

export function summarizeChecks(games: readonly Pick<RepertoireGameCheck, "status">[]): CheckSummary {
  const count = (status: RepertoireGameCheck["status"]) => games.filter((g) => g.status === status).length;
  return {
    total: games.length,
    followed: count("followed"),
    youDeviated: count("you_deviated"),
    opponentDeviated: count("opponent_deviated"),
    notCovered: count("not_covered"),
  };
}

/** "12. Nf3" or "12... Nf6" */
export function moveLabel(moveNumber: number, color: "white" | "black", san: string): string {
  return `${moveNumber}${color === "white" ? "." : "..."} ${san}`;
}

/** "Nf3", "Nf3 or Bc4", "Nf3, Bc4 or d4" */
export function listMoves(moves: readonly string[]): string {
  if (moves.length <= 1) return moves[0] ?? "";
  return `${moves.slice(0, -1).join(", ")} or ${moves[moves.length - 1]}`;
}

/** One sentence for a game's status, for the list and screen readers. */
export function describeCheck(game: RepertoireGameCheck): string {
  const d = game.divergence;
  switch (game.status) {
    case "followed":
      return game.pliesInBook > 0
        ? `Followed your preparation for ${game.pliesInBook} ${game.pliesInBook === 1 ? "move" : "moves"}`
        : "Followed your preparation";
    case "not_covered":
      return `No ${game.color} lines cover this opening`;
    case "you_deviated":
      return d
        ? `You played ${moveLabel(d.moveNumber, d.color, d.played)}; you prepared ${listMoves(d.expected)}`
        : "You left your preparation";
    case "opponent_deviated":
      return d
        ? `${game.opponent.username} played ${moveLabel(d.moveNumber, d.color, d.played)}; you prepared for ${listMoves(d.expected)}`
        : "Your opponent left your preparation";
  }
}
