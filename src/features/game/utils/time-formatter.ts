import {
  MILLISECONDS_IN_SECOND,
  SECONDS_IN_MINUTE,
  MINUTES_IN_HOUR,
  CENTISECONDS_BELOW_MS,
} from "@/constants/time";

/**
 * Formats a clock value: "M:SS", or "H:MM:SS" from an hour up.
 * With showCentiseconds, times under a minute are shown as "S.CC"; a minute
 * or more always uses "M:SS", so the minutes are never dropped.
 */
export const formatTime = (ms: number, showCentiseconds = false): string => {
  const totalMs = Math.max(0, ms);
  const totalSeconds = Math.floor(totalMs / MILLISECONDS_IN_SECOND);
  const hours = Math.floor(totalSeconds / (MINUTES_IN_HOUR * SECONDS_IN_MINUTE));
  const minutes = Math.floor(
    (totalSeconds % (MINUTES_IN_HOUR * SECONDS_IN_MINUTE)) / SECONDS_IN_MINUTE
  );
  const seconds = totalSeconds % SECONDS_IN_MINUTE;
  const centiseconds = Math.floor((totalMs % MILLISECONDS_IN_SECOND) / 10);

  if (showCentiseconds && totalSeconds < SECONDS_IN_MINUTE) {
    return `${seconds}.${centiseconds.toString().padStart(2, "0")}`;
  }

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

/** A running game clock: centiseconds only in the last 10 seconds. */
export const formatClock = (ms: number): string =>
  formatTime(ms, ms < CENTISECONDS_BELOW_MS);
