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

/** What the players call it: a mirror match is a "match", the rest a "series" */
const seriesNoun = (bestOf: number) => (isMirrorMatch(bestOf) ? "match" : "series");

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
 * A mirror match says "match" instead ("Drawn match").
 */
export const seriesStatusLabel = (series: SeriesSummary, viewerId?: number): string => {
  if (series.status === "active") {
    return `Game ${series.next?.number ?? series.gamesPlayed + 1} of ${series.bestOf}`;
  }
  const winner = playerById(series, series.winnerId);
  const name = (p: SeriesPlayer) => (p.id === viewerId ? "You" : p.username);
  const noun = seriesNoun(series.bestOf);
  if (series.endReason === "expired") {
    return winner ? `${name(winner)} won the ${noun} on points (expired)` : `Drawn ${noun} (expired)`;
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
