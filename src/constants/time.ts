export const MILLISECONDS_IN_SECOND = 1000;
export const SECONDS_IN_MINUTE = 60;
export const MINUTES_IN_HOUR = 60;

export const ONE_SECOND_MS = 1000;
export const ONE_MINUTE_MS = 60 * 1000;
export const TWO_MINUTES_MS = 2 * 60 * 1000;
export const FIVE_MINUTES_MS = 5 * 60 * 1000;

/** Clock turns red at or below this, per time control */
export const LOW_TIME_THRESHOLDS: Record<"bullet" | "blitz" | "rapid", number> = {
  rapid: 60000,
  blitz: 20000,
  bullet: 10000,
};

/** Clocks show centiseconds ("9.87") only below this */
export const CENTISECONDS_BELOW_MS = 10_000;

export const CLOCK_TICK_INTERVAL_MS = 100;
