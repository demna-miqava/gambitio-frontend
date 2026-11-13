import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  useMemo,
  useCallback,
} from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  DEFAULT_PALETTE,
  PALETTE_STORAGE_KEY,
  isPaletteId,
  type PaletteId,
} from "@/constants/palettes";

/** The theme on screen */
export type Theme = "light" | "dark";
/** What the user picked; "system" follows the operating system */
export type ThemePreference = Theme | "system";

type ThemeContextValue = {
  /** Resolved theme, never "system" */
  theme: Theme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  /** Switches to the opposite of what's on screen (an explicit choice) */
  toggleTheme: () => void;
  /** Colour palette, independent of light/dark */
  palette: PaletteId;
  setPalette: (palette: PaletteId) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Same key and values the pre-paint script in index.html reads
const THEME_STORAGE_KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

const getSystemTheme = (): Theme =>
  typeof window !== "undefined" && window.matchMedia(DARK_QUERY).matches
    ? "dark"
    : "light";

/** The OS theme, kept current when it changes (e.g. at sunset on auto). */
const useSystemTheme = () => {
  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme);
  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    const onChange = () => setSystemTheme(media.matches ? "dark" : "light");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return systemTheme;
};

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [storedPreference, setPreference] = useLocalStorage<ThemePreference>(
    THEME_STORAGE_KEY,
    "system"
  );
  const preference: ThemePreference =
    storedPreference === "light" || storedPreference === "dark"
      ? storedPreference
      : "system";
  const systemTheme = useSystemTheme();
  const theme: Theme = preference === "system" ? systemTheme : preference;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // The palette is saved on the account (Settings); this is the device's
  // copy, so it applies before settings load and on signed-out pages.
  // SettingsProvider keeps it in step with the account. An unknown value
  // (an old or hand-edited one) falls back to the default.
  const [storedPalette, setPalette] = useLocalStorage<PaletteId>(
    PALETTE_STORAGE_KEY,
    DEFAULT_PALETTE
  ) as [unknown, (palette: PaletteId) => void];
  const palette: PaletteId = isPaletteId(storedPalette) ? storedPalette : DEFAULT_PALETTE;

  useEffect(() => {
    document.documentElement.dataset.palette = palette;
  }, [palette]);

  const toggleTheme = useCallback(
    () => setPreference(theme === "dark" ? "light" : "dark"),
    [setPreference, theme]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, preference, setPreference, toggleTheme, palette, setPalette }),
    [theme, preference, setPreference, toggleTheme, palette, setPalette]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/* eslint-disable-next-line */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
