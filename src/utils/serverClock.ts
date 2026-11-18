/**
 * How far this device's clock is from the server's, estimated from the HTTP
 * `Date` header of API responses (recorded by the axios client). Countdowns
 * to a time the server set (a timed match's end, a tournament's start) use
 * serverNow() instead of Date.now(), so a device whose clock is a few
 * minutes off still counts down to the server's moment.
 *
 * The header has whole seconds only, and the API has to expose it to the
 * page (CORS Access-Control-Expose-Headers: Date); without it nothing is
 * recorded and serverNow() is Date.now().
 */

/** Samples kept; the median of them is the estimate, so one odd response can't move it */
const SAMPLES = 5;
/** Offsets smaller than this are the header's rounding and the network, not a wrong clock */
export const MIN_CLOCK_OFFSET_MS = 2_000;
/** Further off than this is a cached response's old date, not this device's clock */
const MAX_CLOCK_OFFSET_MS = 24 * 60 * 60_000;
/** The header drops the milliseconds: the server's moment was on average half a second later */
const HALF_SECOND_MS = 500;

let samples: number[] = [];

/** Records one response's `Date` header, received at `receivedAt` (this device's clock). */
export function recordServerDate(header: unknown, receivedAt: number = Date.now()): void {
  if (typeof header !== "string" || !header) return;
  const serverMs = Date.parse(header);
  if (!Number.isFinite(serverMs)) return;
  const offset = serverMs + HALF_SECOND_MS - receivedAt;
  if (Math.abs(offset) > MAX_CLOCK_OFFSET_MS) return;
  samples = [...samples, offset].slice(-SAMPLES);
}

/** Milliseconds to add to Date.now() for the server's time; 0 when the clocks agree closely enough. */
export function serverClockOffset(): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return Math.abs(median) < MIN_CLOCK_OFFSET_MS ? 0 : median;
}

/** The server's current time, as well as this device can tell. */
export const serverNow = (): number => Date.now() + serverClockOffset();

/** Forgets every sample (tests). */
export function resetServerClock(): void {
  samples = [];
}
