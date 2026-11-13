const MIN_MS = 400;
const LEVEL_SPAN_MS = 300;
const JITTER_MS = 200;
const MIN_RATING = 300;
const MAX_RATING = 3500;

/**
 * How long a bot reply should appear to take, 400–900 ms. Without it the
 * engine answers in a few milliseconds: the two move sounds overlap and the
 * player's own last-move highlight is replaced before it can be seen.
 * Stronger bots take a little longer; jitter keeps it from feeling metronomic.
 */
export const botThinkDelayMs = (rating: number, random = Math.random()): number => {
  const level = Math.min(Math.max((rating - MIN_RATING) / (MAX_RATING - MIN_RATING), 0), 1);
  return Math.round(MIN_MS + level * LEVEL_SPAN_MS + random * JITTER_MS);
};
