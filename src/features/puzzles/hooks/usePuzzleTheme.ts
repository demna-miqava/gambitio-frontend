import { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { isValidThemeKey } from "../utils/themeLabels";

const STORAGE_KEY = "gambitio:puzzle-theme";
const PARAM = "theme";

/** Infinite mode's remembered theme filter ("" = all themes), e.g. for Home's next puzzle */
export const readStoredPuzzleTheme = (): string => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isValidThemeKey(value) ? value : "";
  } catch {
    return "";
  }
};

const store = (theme: string) => {
  try {
    if (theme) localStorage.setItem(STORAGE_KEY, theme);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode): the URL still carries the choice
  }
};

/**
 * Infinite mode's theme filter ("" = all themes). The ?theme= query param is
 * the source of truth (shareable, works with back/forward); the last choice is
 * remembered in localStorage and restored when the page opens without one.
 */
export const usePuzzleTheme = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get(PARAM);
  const theme = isValidThemeKey(param) ? param : param === null ? readStoredPuzzleTheme() : "";

  // Opened without ?theme=: put the remembered one in the URL
  useEffect(() => {
    if (param === null && theme) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(PARAM, theme);
          return next;
        },
        { replace: true }
      );
    }
  }, [param, theme, setSearchParams]);

  const setTheme = useCallback(
    (next: string) => {
      const value = isValidThemeKey(next) ? next : "";
      store(value);
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (value) params.set(PARAM, value);
          else params.delete(PARAM);
          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  return [theme, setTheme] as const;
};
