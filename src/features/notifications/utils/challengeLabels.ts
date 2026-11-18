import type { PlayerColorOption } from "@/types/game.types";
import { formatClock, formatTimeControl, timeOdds } from "@/utils/timeControl";
import { bestOfLabel, isMirrorMatch, timedMatchLabel } from "@/features/series/utils/seriesFormat";

/**
 * "Best of 3" or "Mirror match" for a series challenge, "Game 2 of 3" (or
 * "Mirror match, game 2") for one that continues a series, "15-minute timed
 * match" for a timed match; null for a single game.
 */
export const describeMatchFormat = (
  bestOf: number | undefined,
  seriesGame?: number | null,
  matchMinutes?: number | null
): string | null => {
  if (matchMinutes != null) {
    const label = timedMatchLabel(matchMinutes);
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  if (!bestOf || bestOf <= 1) return null;
  if (!seriesGame) return bestOfLabel(bestOf);
  return isMirrorMatch(bestOf) ? `Mirror match, game ${seriesGame}` : `Game ${seriesGame} of ${bestOf}`;
};

/** "From the Sicilian Defense", for a challenge that starts from an opening; null otherwise */
export const describeChallengeOpening = (opening: { name: string } | null | undefined): string | null =>
  opening ? `From the ${opening.name}` : null;

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
