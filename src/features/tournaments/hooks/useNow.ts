import { useEffect, useState } from "react";

/** The current time, updated every `everyMs` while `active` (for countdowns). */
export const useNow = (everyMs = 1_000, active = true): number => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(timer);
  }, [everyMs, active]);
  return now;
};
