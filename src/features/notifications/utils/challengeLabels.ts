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

/** A challenge's terms, as the toast, the inbox, the challenges list and the "waiting" card show them */
export interface ChallengeTerms {
  /** "Best of 3", "Mirror match, game 2", "15-minute timed match"; null for a single game */
  format: string | null;
  /** "5+0", or "Time odds: you 5 min, alice 1 min" */
  time: string;
  /** Unrated without time odds (the odds already say so) */
  unrated: boolean;
  /** "You play white", or "You play white first" for a new match */
  color: string;
  /** "From the Sicilian Defense"; null for the initial position */
  opening: string | null;
}

type ChallengeLike = {
  time: number;
  increment: number;
  ownTime?: number | null;
  opponentTime?: number | null;
  color: PlayerColorOption;
  bestOf?: number;
  seriesGame?: number | null;
  matchMinutes?: number | null;
  rated?: boolean;
  opening?: { name: string } | null;
};

/**
 * Everything a challenge's summary says, piece by piece, so each place can
 * style the pieces its own way. `opponent` is the other player's name;
 * `firstColor` says "first" after the colour of a new match (off for the
 * sender's own card).
 */
export const describeChallengeTerms = (
  challenge: ChallengeLike,
  opponent: string,
  { firstColor = true }: { firstColor?: boolean } = {}
): ChallengeTerms => {
  const format = describeMatchFormat(challenge.bestOf, challenge.seriesGame, challenge.matchMinutes);
  const color = describeChallengeColor(challenge.color);
  return {
    format,
    time: describeChallengeTime(challenge, opponent),
    unrated: isCasualChallenge(challenge),
    color: firstColor && format && !challenge.seriesGame ? `${color} first` : color,
    opening: describeChallengeOpening(challenge.opening),
  };
};

/** The terms but the opening on one line: "Best of 3 · 5+0 · Unrated · You play white first" */
export const challengeTermsLine = ({ format, time, unrated, color }: ChallengeTerms): string =>
  [format, time, unrated && "Unrated", color].filter(Boolean).join(" · ");

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
