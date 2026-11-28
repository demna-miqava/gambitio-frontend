import { useCallback, useState } from "react";

const KEY = "quickPairingRated";

const read = () => {
  try {
    return localStorage.getItem(KEY) !== "false";
  } catch {
    // Storage disabled: rated, like a first visit
    return true;
  }
};

/**
 * Whether quick pairing looks for a rated game (the default) or a casual
 * one. Remembered on this device, so Home and the Play page agree and the
 * choice is still there next time.
 */
export const useRatedPreference = () => {
  const [rated, setRatedState] = useState(read);
  const setRated = useCallback((next: boolean) => {
    setRatedState(next);
    try {
      localStorage.setItem(KEY, String(next));
    } catch {
      // Kept for this page view only
    }
  }, []);
  return [rated, setRated] as const;
};
