export const SPARKLINE_WIDTH = 72;
export const SPARKLINE_HEIGHT = 24;
/** Room for the last point's dot and the line's own width at the edges */
export const SPARKLINE_PAD = 3;

/** The games as points across the box, the lowest rating at the bottom */
export function sparklinePoints(ratings: readonly number[]): { x: number; y: number }[] {
  const min = Math.min(...ratings);
  const max = Math.max(...ratings);
  const span = max - min;
  const step = ratings.length > 1 ? (SPARKLINE_WIDTH - 2 * SPARKLINE_PAD) / (ratings.length - 1) : 0;
  return ratings.map((rating, i) => ({
    x: SPARKLINE_PAD + i * step,
    // A flat run sits in the middle
    y: span === 0 ? SPARKLINE_HEIGHT / 2 : SPARKLINE_HEIGHT - SPARKLINE_PAD - ((rating - min) / span) * (SPARKLINE_HEIGHT - 2 * SPARKLINE_PAD),
  }));
}
