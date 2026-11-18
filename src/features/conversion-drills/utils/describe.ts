import { format, formatDistanceStrict } from "date-fns";
import type { ConversionDrill } from "../types";

/** How the game went for the player: "Drawn", "Lost", "Lost on time" */
export const describeOutcome = (game: Pick<ConversionDrill["game"], "result" | "endReason">): string => {
  if (game.result === "draw") return "Drawn";
  return game.endReason === "timeout" ? "Lost on time" : "Lost";
};

/** "vs bobby · 12 Nov · Drawn" */
export const describeOrigin = (drill: Pick<ConversionDrill, "game">): string =>
  `vs ${drill.game.opponent.username} · ${format(new Date(drill.game.createdAt), "d MMM")} · ${describeOutcome(drill.game)}`;

/** "Move 23", the full move the position is at */
export const moveNumberLabel = (ply: number): string => `Move ${Math.floor(ply / 2) + 1}`;

/** Where the drill stands: "New", "Due now", "Converted 2 of 3 · next in 3 days" */
export const reviewLabel = (drill: Pick<ConversionDrill, "attempts" | "successes" | "dueAt">, now = Date.now()): string => {
  if (drill.attempts === 0) return "New";
  const record = `Converted ${drill.successes} of ${drill.attempts}`;
  const due = new Date(drill.dueAt).getTime();
  if (due <= now) return `${record} · due now`;
  return `${record} · next in ${formatDistanceStrict(due, now)}`;
};
