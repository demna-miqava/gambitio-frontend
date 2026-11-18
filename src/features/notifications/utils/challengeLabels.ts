import type { PlayerColorOption } from "@/types/game.types";
import { formatClock, formatTimeControl, timeOdds } from "@/utils/timeControl";

/**
 * "Best of 3" for a series challenge, "Game 2 of 3" for one that continues
 * a series; null for a single game.
 */
export const describeMatchFormat = (bestOf: number | undefined, seriesGame?: number | null): string | null => {
  if (!bestOf || bestOf <= 1) return null;
  return seriesGame ? `Game ${seriesGame} of ${bestOf}` : `Best of ${bestOf}`;
};

/**
 * Whether to call a challenge unrated. A challenge with time odds is unrated
 * too, but its clocks already say so ("Time odds: …").
 */
export const isCasualChallenge = (challenge: {
  rated?: boolean;
  ownTime?: number | null;
  opponentTime?: number | null;
}): boolean => challenge.rated === false && !timeOdds(challenge.ownTime, challenge.opponentTime);

/** "You play white" / "You play black" / "Random colors", from the receiver's side. */
export const describeChallengeColor = (color: PlayerColorOption): string => {
  switch (color) {
    case "white":
      return "You play white";
    case "black":
      return "You play black";
    default:
      return "Random colors";
  }
};

/**
 * The clocks of a challenge, from the side of the player reading it: "5+0",
 * or with time odds "Time odds: you 5 min, alice 1 min" (plus the increment).
 * `opponent` is the other player's name.
 */
export const describeChallengeTime = (
  challenge: { time: number; increment: number; ownTime?: number | null; opponentTime?: number | null },
  opponent: string
): string => {
  const { time, increment } = challenge;
  const odds = timeOdds(challenge.ownTime, challenge.opponentTime);
  if (!odds) return formatTimeControl(time, increment);
  return (
    `Time odds: you ${formatClock(odds[0])}, ${opponent} ${formatClock(odds[1])}` +
    (increment ? `, +${increment} sec` : "")
  );
};
