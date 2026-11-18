import { useEffect, useState } from "react";
import { serverNow } from "@/utils/serverClock";

/** Whether a countdown to `until` (ms, server time) still has to tick at `now`. */
export const keepsTicking = (now: number, until?: number | null): boolean =>
  until == null || !Number.isFinite(until) || now < until;

/**
 * The server's current time (serverNow: this device's clock, corrected),
 * updated every `everyMs` while `active` (for countdowns to times the
 * server set). With `until`, it stops updating once that moment has passed:
 * a countdown that has reached zero has nothing more to show.
 */
export const useNow = (everyMs = 1_000, active = true, until?: number | null): number => {
  const [now, setNow] = useState(() => serverNow());
  useEffect(() => {
    if (!active) return;
    const start = serverNow();
    setNow(start);
    if (!keepsTicking(start, until)) return;
    const timer = setInterval(() => {
      const next = serverNow();
      setNow(next);
      if (!keepsTicking(next, until)) clearInterval(timer);
    }, everyMs);
    return () => clearInterval(timer);
  }, [everyMs, active, until]);
  return now;
};
