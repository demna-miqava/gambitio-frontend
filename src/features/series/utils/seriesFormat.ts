import type { SeriesPlayer, SeriesSummary } from "../types";

/** Points with a half-point glyph: 0, ½, 1, 1½, 2 … */
export const formatPoints = (points: number): string => {
  const whole = Math.floor(points);
  const half = points - whole >= 0.5;
  if (!half) return String(whole);
  return whole === 0 ? "½" : `${whole}½`;
};

/** "1½–½", with `first` on the left */
export const formatScoreline = (first: SeriesPlayer, second: SeriesPlayer): string =>
  `${formatPoints(first.score)}–${formatPoints(second.score)}`;

/** Spoken score, e.g. "1.5 to 0.5" (screen readers read "½" poorly) */
export const spokenScoreline = (first: SeriesPlayer, second: SeriesPlayer): string =>
  `${first.score} to ${second.score}`;

/** A series of two games, one with each colour, scored as a pair */
export const MIRROR_MATCH_BEST_OF = 2;

export const isMirrorMatch = (bestOf: number | undefined): boolean => bestOf === MIRROR_MATCH_BEST_OF;

/** "Best of 3", or "Mirror match" */
export const bestOfLabel = (bestOf: number): string =>
  isMirrorMatch(bestOf) ? "Mirror match" : `Best of ${bestOf}`;

/** The match lengths a timed match can have, in minutes (MATCH_MINUTES in the backend) */
export const MATCH_MINUTES = [5, 10, 15, 20, 30, 45, 60] as const;

/** In a timed match, wins in a row after which points count double (as in an arena) */
export const TIMED_STREAK_AFTER = 2;

export const isTimedMatch = (series: { matchMinutes?: number | null }): boolean =>
  series.matchMinutes != null;

/** "15-minute timed match" */
export const timedMatchLabel = (minutes: number): string => `${minutes}-minute timed match`;

/**
 * A game's longest plausible length: both clocks, and the increment over 40
 * moves each. A timed match needs room for at least one (gameFitsMatch in
 * the backend's game/timedMatch.ts).
 */
export const gameFitsMatch = (time: number, increment: number, minutes: number): boolean =>
  2 * (time + 40 * increment) <= minutes * 60;

/** "Best of 3", "Mirror match" or "15-minute timed match" */
export const seriesFormatLabel = (series: { bestOf: number; matchMinutes?: number | null }): string =>
  series.matchMinutes != null ? timedMatchLabel(series.matchMinutes) : bestOfLabel(series.bestOf);

/** What the players call it: a mirror match or a timed match is a "match", the rest a "series" */
export const seriesNoun = (series: { bestOf: number; matchMinutes?: number | null }) =>
  isMirrorMatch(series.bestOf) || isTimedMatch(series) ? "match" : "series";

/** The two players with `viewerId` first, when they play in the series. */
export const playersFor = (
  series: SeriesSummary,
  viewerId?: number
): [SeriesPlayer, SeriesPlayer] =>
  viewerId === series.playerTwo.id
    ? [series.playerTwo, series.playerOne]
    : [series.playerOne, series.playerTwo];

export const playerById = (series: SeriesSummary, id: number | null): SeriesPlayer | null =>
  id === series.playerOne.id ? series.playerOne : id === series.playerTwo.id ? series.playerTwo : null;

export type SeriesOutcome = "won" | "lost" | "drawn" | "active";

/** How the series stands for a player in it (null for anyone else). */
export const seriesOutcomeFor = (series: SeriesSummary, userId?: number): SeriesOutcome | null => {
  if (userId !== series.playerOne.id && userId !== series.playerTwo.id) return null;
  if (series.status === "active") return "active";
  if (series.winnerId === null) return "drawn";
  return series.winnerId === userId ? "won" : "lost";
};

/**
 * One line on where the series stands: "Game 3 of 5", "alice won the
 * series", "You won the series", "Drawn series", "bobby resigned the
 * series" (the winner is the other player), or how an expired series ended.
 * A mirror match or a timed match says "match" instead ("Drawn match"); a
 * timed match in progress is at "Game 3".
 */
export const seriesStatusLabel = (series: SeriesSummary, viewerId?: number): string => {
  if (series.status === "active") {
    const number = series.next?.number ?? series.gamesPlayed + 1;
    return isTimedMatch(series) ? `Game ${number}` : `Game ${number} of ${series.bestOf}`;
  }
  const winner = playerById(series, series.winnerId);
  const name = (p: SeriesPlayer) => (p.id === viewerId ? "You" : p.username);
  const noun = seriesNoun(series);
  if (series.endReason === "expired") {
    return winner ? `${name(winner)} won the ${noun} on points (expired)` : `Drawn ${noun} (expired)`;
  }
  if (series.endReason === "abandoned") {
    return winner ? `${name(winner)} won the ${noun} (abandoned)` : `Drawn ${noun} (abandoned)`;
  }
  if (!winner) return `Drawn ${noun}`;
  if (series.endReason === "resignation") {
    const loser = winner.id === series.playerOne.id ? series.playerTwo : series.playerOne;
    return `${name(loser)} resigned the ${noun}`;
  }
  return `${name(winner)} won the ${noun}`;
};

/** Who has white in the next game, e.g. "You play white in game 2". */
export const nextGameLabel = (series: SeriesSummary, viewerId?: number): string | null => {
  const next = series.next;
  if (!next) return null;
  if (viewerId === next.whiteId) return `You play white in game ${next.number}`;
  if (viewerId === next.blackId) return `You play black in game ${next.number}`;
  const white = playerById(series, next.whiteId);
  return white ? `${white.username} plays white in game ${next.number}` : null;
};

export type MatchPhase =
  | { kind: "running"; msLeft: number }
  /** No new game starts; the one being played counts */
  | { kind: "last-game"; msLeft: number }
  | { kind: "over" };

/** Where a timed match's clock stands at `now`. */
export const matchPhase = (
  series: Pick<SeriesSummary, "status" | "endsAt" | "lastGameStartsBy">,
  now: number
): MatchPhase => {
  if (series.status !== "active" || !series.endsAt) return { kind: "over" };
  const endsAt = new Date(series.endsAt).getTime();
  const lastStart = series.lastGameStartsBy ? new Date(series.lastGameStartsBy).getTime() : endsAt;
  if (now < lastStart) return { kind: "running", msLeft: endsAt - now };
  if (now < endsAt) return { kind: "last-game", msLeft: endsAt - now };
  return { kind: "over" };
};
