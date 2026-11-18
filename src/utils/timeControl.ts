const FRACTIONS: Record<number, string> = { 15: "¼", 30: "½", 45: "¾" };

/** Starting time in minutes: whole numbers as is, ¼/½/¾, else a decimal. */
const formatMinutes = (timeInSeconds: number): string => {
  if (timeInSeconds % 60 === 0) return String(timeInSeconds / 60);
  if (timeInSeconds < 60 && FRACTIONS[timeInSeconds]) return FRACTIONS[timeInSeconds];
  return String(Math.round((timeInSeconds / 60) * 100) / 100);
};

/**
 * The standard "minutes+increment" label: 300, 0 → "5+0"; 180, 2 → "3+2";
 * 30, 0 → "½+0". Used for every time control label in the app.
 *
 * @param time - Starting time in seconds
 * @param increment - Increment in seconds (missing or null means 0)
 */
export const formatTimeControl = (
  time: number,
  increment?: number | null
): string => `${formatMinutes(time)}+${increment ?? 0}`;

/** A starting clock in words: 300 → "5 min", 30 → "30 sec", 90 → "1.5 min". */
export const formatClock = (timeInSeconds: number): string =>
  timeInSeconds < 60 ? `${timeInSeconds} sec` : `${formatMinutes(timeInSeconds)} min`;

/**
 * The two starting clocks when both are known and differ (a game with time
 * odds), in the order given; null for an even game.
 */
export const timeOdds = (
  first: number | null | undefined,
  second: number | null | undefined
): [number, number] | null =>
  first != null && second != null && first !== second ? [first, second] : null;

/** Whether two starting clocks are both known and differ (a game with time odds). */
export const hasTimeOdds = (
  first: number | null | undefined,
  second: number | null | undefined
): boolean => timeOdds(first, second) !== null;

/**
 * The two clocks of a game with time odds, in the order given (white then
 * black, or you then them): "5 min vs 1 min", and "5 min vs 1 min, +2 sec"
 * with an increment.
 */
export const formatTimeOdds = (
  first: number,
  second: number,
  increment?: number | null
): string =>
  `${formatClock(first)} vs ${formatClock(second)}${increment ? `, +${increment} sec` : ""}`;

/**
 * The time label of a game: "5+0", or both clocks (white's first) when the
 * game has time odds.
 */
export const formatGameTime = (game: {
  time: number;
  increment?: number | null;
  whiteTime?: number | null;
  blackTime?: number | null;
}): string => {
  const odds = timeOdds(game.whiteTime, game.blackTime);
  return odds
    ? formatTimeOdds(odds[0], odds[1], game.increment)
    : formatTimeControl(game.time, game.increment);
};
