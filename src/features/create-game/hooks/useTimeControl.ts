import { useState, useCallback } from "react";
import type { TimeControlType } from "@/types";

export interface TimeControl {
  format: TimeControlType;
  /** Starting time per side, in seconds */
  time: number;
  /** Increment per move, in seconds */
  increment: number;
}

/**
 * Hook to manage time control selection: format (bullet/blitz/rapid),
 * starting time and increment, both in seconds.
 */
export const useTimeControl = (
  initialFormat: TimeControlType = "blitz",
  initialTime = 180,
  initialIncrement = 0
) => {
  const [timeControl, setTimeControl] = useState<TimeControl>({
    format: initialFormat,
    time: initialTime,
    increment: initialIncrement,
  });

  const updateTimeControl = useCallback(
    (format: TimeControlType, time: number, increment: number = 0) => {
      setTimeControl({ format, time, increment });
    },
    []
  );

  return { timeControl, updateTimeControl };
};
