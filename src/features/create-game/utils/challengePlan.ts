import type { PlayerColorOption } from "@/types/game.types";
import type { BestOf } from "@/features/notifications/types/websocket-messages";
import type { SendChallengeData } from "@/features/notifications/hooks/useManageChallenge";
import { gameFitsMatch, MIRROR_MATCH_BEST_OF } from "@/features/series/utils/seriesFormat";
import { formatTimeControl, formatTimeOdds } from "@/utils/timeControl";
import { describeChallengeColor } from "@/features/notifications/utils/challengeLabels";
import { defaultShorterClock, shorterClocks } from "../constants/timeControls";
import type { LastChallenge } from "./lastChallenge";

/** One game, a mirror match, a best-of series, or a timed match */
export type MatchFormat = "single" | "mirror" | "series" | "timed";
export type SeriesLength = "3" | "5";
/** Who starts with less time: nobody, the sender, or the friend */
export type TimeOdds = "even" | "me" | "them";
/** Whether the game (or every game of the match) changes ratings */
export type Rating = "rated" | "unrated";

/** What the friend challenge form holds */
export interface ChallengeForm {
  friendId: number;
  color: PlayerColorOption;
  /** The time control: the clock of whoever doesn't get time odds */
  time: number;
  increment: number;
  format: MatchFormat;
  /** Used when `format` is "series" */
  seriesLength: SeriesLength;
  /** Used when `format` is "timed" */
  matchMinutes: number;
  odds: TimeOdds;
  /** The shorter clock picked for time odds; null for the default */
  pickedClock: number | null;
  rating: Rating;
  /** The opening the games start from; null for the initial position */
  openingId: string | null;
}

/**
 * Why the game is unrated whatever the Rated choice says: time odds, or a
 * chosen opening outside a mirror match (one player could prepare it; a
 * mirror match plays it from both sides). The server enforces both.
 */
export type ForcedUnrated = "odds" | "opening";

/** The challenge a form describes, and what the form shows about it */
export interface ChallengePlan {
  bestOf: BestOf;
  /** A timed match's length; null for any other format */
  matchMinutes: number | null;
  /** More than one game, whatever the format */
  isMatch: boolean;
  /** The shorter clocks on offer for time odds (none below the shortest time control) */
  clockChoices: number[];
  /** The shorter clock in use: the picked one while it still fits, else the default */
  shorterClock: number | null;
  hasOdds: boolean;
  ownTime: number;
  friendTime: number;
  /** Set when the Rated choice doesn't apply */
  forcedUnrated: ForcedUnrated | null;
  rated: boolean;
  /** A timed match needs room for one whole game (the server checks too) */
  fitsMatch: boolean;
  /** What Send sends */
  data: SendChallengeData;
}

const bestOfFor = (format: MatchFormat, seriesLength: SeriesLength): BestOf =>
  format === "mirror"
    ? MIRROR_MATCH_BEST_OF
    : format === "series"
      ? (Number(seriesLength) as BestOf)
      : 1;

/**
 * The rules of a friend challenge, in one place: the format sets bestOf (a
 * timed match is bestOf 1 with its minutes), time odds pick a shorter clock
 * for one side, and time odds or an opening outside a mirror match make it
 * unrated. Options that don't apply to the chosen format aren't sent.
 */
export const planChallenge = (form: ChallengeForm): ChallengePlan => {
  const bestOf = bestOfFor(form.format, form.seriesLength);
  const matchMinutes = form.format === "timed" ? form.matchMinutes : null;

  const clockChoices = shorterClocks(form.time);
  const shorterClock =
    form.pickedClock !== null && clockChoices.includes(form.pickedClock)
      ? form.pickedClock
      : defaultShorterClock(form.time);
  const hasOdds = form.odds !== "even" && shorterClock !== null;
  const ownTime = hasOdds && form.odds === "me" ? shorterClock : form.time;
  const friendTime = hasOdds && form.odds === "them" ? shorterClock : form.time;

  const forcedUnrated: ForcedUnrated | null = hasOdds
    ? "odds"
    : form.openingId !== null && bestOf !== MIRROR_MATCH_BEST_OF
      ? "opening"
      : null;
  const rated = forcedUnrated === null && form.rating === "rated";

  return {
    bestOf,
    matchMinutes,
    isMatch: bestOf > 1 || matchMinutes !== null,
    clockChoices,
    shorterClock,
    hasOdds,
    ownTime,
    friendTime,
    forcedUnrated,
    rated,
    fitsMatch: matchMinutes === null || gameFitsMatch(form.time, form.increment, matchMinutes),
    data: {
      challengedId: form.friendId,
      color: form.color,
      time: ownTime,
      increment: form.increment,
      ...(hasOdds && { opponentTime: friendTime }),
      bestOf,
      ...(!rated && { rated: false }),
      ...(form.openingId !== null && { openingId: form.openingId }),
      ...(matchMinutes !== null && { matchMinutes }),
    },
  };
};

/**
 * The choices under "More options" that aren't the defaults, in the order
 * the form shows them: time odds, the match format, the starting position.
 * The folded section shows them, so a mirror match or an opening set there
 * is never out of sight. Empty for a plain single game.
 */
export const extraOptionsSummary = (plan: ChallengePlan, openingName: string | null): string[] => {
  const parts: string[] = [];
  if (plan.hasOdds) parts.push(formatTimeOdds(plan.ownTime, plan.friendTime));
  if (plan.matchMinutes !== null) parts.push(`${plan.matchMinutes}-minute match`);
  else if (plan.bestOf === MIRROR_MATCH_BEST_OF) parts.push("Mirror match");
  else if (plan.bestOf > 1) parts.push(`Best of ${plan.bestOf}`);
  if (openingName) parts.push(openingName);
  return parts;
};

/** Under the format choice: how the chosen one is played and scored */
export const formatHint = (bestOf: BestOf, matchMinutes: number | null): string | null => {
  if (matchMinutes !== null) {
    return `As many games as fit in ${matchMinutes} minutes. Each next game starts by itself with the colours swapped. A win scores 2, a draw 1, and after two wins in a row points count double. Most points when the time is up wins; a game still going then is played out and counts.`;
  }
  if (bestOf === MIRROR_MATCH_BEST_OF) {
    return "Two games from the same position, one with each colour, scored as a pair: a win each is a drawn match.";
  }
  if (bestOf > 1) {
    return `Colours alternate each game and a draw is half a point. Whoever leads after ${bestOf} games wins, or sooner once the lead can't be caught.`;
  }
  return null;
};

/**
 * Under the Rating choice: what unrated means for this format, or why the
 * challenge is unrated anyway. Null for a rated challenge.
 */
export const ratingHint = (plan: Pick<ChallengePlan, "bestOf" | "matchMinutes" | "forcedUnrated" | "rated">): string | null => {
  if (plan.forcedUnrated === "opening") {
    return "Games from a chosen opening are unrated, except mirror matches: you could have prepared it.";
  }
  if (plan.forcedUnrated === "odds") return "Games with time odds are unrated.";
  if (plan.rated) return null;
  const scope =
    plan.matchMinutes !== null || plan.bestOf === MIRROR_MATCH_BEST_OF
      ? "No game of the match changes"
      : plan.bestOf > 1
        ? "No game of the series changes"
        : "The game doesn't change";
  return `${scope} either player's rating.`;
};

/**
 * What one tap on a friend sends: a single game on the terms of the last
 * challenge, by the same rules as the form (planChallenge).
 */
export const planQuickChallenge = (friendId: number, terms: LastChallenge): SendChallengeData =>
  planChallenge({
    friendId,
    color: terms.color,
    time: terms.time,
    increment: terms.increment,
    format: "single",
    seriesLength: "3",
    matchMinutes: 0,
    odds: "even",
    pickedClock: null,
    rating: terms.rated ? "rated" : "unrated",
    openingId: null,
  }).data;

/** The terms one tap sends, in words: "5+0 · Rated · Random colors" */
export const quickChallengeSummary = (terms: LastChallenge): string =>
  [
    formatTimeControl(terms.time, terms.increment),
    terms.rated ? "Rated" : "Unrated",
    describeChallengeColor(terms.color),
  ].join(" · ");
