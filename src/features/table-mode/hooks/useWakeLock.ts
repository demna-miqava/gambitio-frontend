import { useEffect } from "react";

type WakeLockSentinelLike = { release: () => Promise<void>; released?: boolean };
type WakeLockLike = { request: (type: "screen") => Promise<WakeLockSentinelLike> };

/**
 * Keeps the screen on while `active`, where the browser has the Screen Wake
 * Lock API (most current browsers; not older iOS). The browser drops the
 * lock whenever the page is hidden, so it is asked for again on return.
 * Without the API this does nothing; the phone's own sleep setting applies.
 */
export const useWakeLock = (active: boolean) => {
  useEffect(() => {
    const wakeLock = (navigator as Navigator & { wakeLock?: WakeLockLike }).wakeLock;
    if (!active || !wakeLock) return;
    let sentinel: WakeLockSentinelLike | null = null;
    let cancelled = false;
    const acquire = () => {
      if (document.visibilityState !== "visible") return;
      wakeLock
        .request("screen")
        .then((lock) => {
          if (cancelled) void lock.release().catch(() => {});
          else sentinel = lock;
        })
        // Refused (battery saver, not allowed): the clock still works
        .catch(() => {});
    };
    acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", acquire);
      void sentinel?.release().catch(() => {});
    };
  }, [active]);
};
