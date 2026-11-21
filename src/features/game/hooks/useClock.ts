import { useCallback, useEffect, useState, useRef } from "react";
import {
  LOW_TIME_THRESHOLDS,
  CLOCK_TICK_INTERVAL_MS,
  ONE_SECOND_MS,
} from "@/constants/time";
import { getTimeControlFormat } from "@/features/create-game/constants/timeControls";
import { sameClockDisplay } from "../utils/time-formatter";

export const useClock = ({
  startingTime,
  isActive,
  onTimeout,
  gameEnded = false,
  serverTimeLeft,
}: {
  startingTime: number; // in seconds
  isActive: boolean;
  onTimeout?: () => void;
  gameEnded?: boolean;
  serverTimeLeft?: number; // Time from server in milliseconds
}) => {
  // `time` is what's on screen; timeRef counts down precisely. The clock
  // ticks ten times a second but re-renders only when the display changes
  // (see sameClockDisplay).
  const [time, setTimeState] = useState(
    serverTimeLeft ?? startingTime * ONE_SECOND_MS
  );
  const timeRef = useRef(time);
  const shownRef = useRef(time);
  const lastTickRef = useRef<number>(Date.now());
  const intervalRef = useRef<number | null>(null);
  const timeoutCalledRef = useRef(false);

  const format = getTimeControlFormat(startingTime);
  const lowTimeMs = LOW_TIME_THRESHOLDS[format];
  const isLowTime = time <= lowTimeMs;
  const lowTimeRef = useRef(lowTimeMs);
  useEffect(() => {
    lowTimeRef.current = lowTimeMs;
  }, [lowTimeMs]);

  /** Sets the time; `always` shows it even if it looks the same */
  const setTime = useCallback((next: number, always = false) => {
    timeRef.current = next;
    if (!always && sameClockDisplay(shownRef.current, next, lowTimeRef.current)) return;
    shownRef.current = next;
    setTimeState(next);
  }, []);

  // Sync with server time when received
  useEffect(() => {
    if (serverTimeLeft !== undefined && serverTimeLeft !== null) {
      setTime(serverTimeLeft, true);
      lastTickRef.current = Date.now();
    }
  }, [serverTimeLeft, setTime]);

  // Handle timeout: once each time the clock reaches zero. Time it gets
  // back (an early flag the server didn't take, increment, added time, a
  // takeback, a resync) makes the next zero count again.
  useEffect(() => {
    if (time > 0) {
      timeoutCalledRef.current = false;
      return;
    }
    if (!timeoutCalledRef.current && onTimeout) {
      timeoutCalledRef.current = true;
      onTimeout();
    }
  }, [time, onTimeout]);

  // Countdown timer - runs between server updates for smooth display
  useEffect(() => {
    if (gameEnded || !isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    lastTickRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTickRef.current;
      lastTickRef.current = now;

      setTime(Math.max(0, timeRef.current - elapsed));
    }, CLOCK_TICK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, gameEnded, setTime]);

  return { time, isLowTime };
};
