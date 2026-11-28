import { DEFAULT_PALETTE, getPalette, isPaletteId } from "@/constants/palettes";
import type { GifTheme } from "./draw";

/**
 * The colors the board has right now: the user's palette (<html
 * data-palette>) in the current light/dark theme. Board colors come from the
 * same CSS variables the board uses (src/index.css); the strips use the
 * palette's page background so the GIF looks like the app.
 */
export function readGifTheme(root: HTMLElement = document.documentElement): GifTheme {
  const paletteId = isPaletteId(root.dataset.palette) ? root.dataset.palette : DEFAULT_PALETTE;
  const dark = root.classList.contains("dark");
  const colors = getPalette(paletteId)[dark ? "dark" : "light"];
  const style = getComputedStyle(root);
  // Some of the board's variables are derived from others (var(), color-mix()),
  // which a canvas can't read as written: the browser resolves them on a probe
  const probe = document.createElement("span");
  probe.style.display = "none";
  root.appendChild(probe);
  const cssVar = (name: string, fallback: string) => {
    if (!style.getPropertyValue(name).trim()) return fallback;
    probe.style.color = `var(${name})`;
    return getComputedStyle(probe).color || fallback;
  };

  const theme: GifTheme = {
    boardLight: cssVar("--board-light", colors.boardLight),
    boardDark: cssVar("--board-dark", colors.boardDark),
    lastMove: cssVar("--board-last-move", "rgba(232, 200, 100, 0.45)"),
    coordOnLight: cssVar("--board-coord-on-light", colors.boardDark),
    coordOnDark: cssVar("--board-coord-on-dark", colors.boardLight),
    background: colors.background,
    text: dark ? "#f2eee4" : "#1f1d19",
    muted: dark ? "rgba(242, 238, 228, 0.45)" : "rgba(31, 29, 25, 0.35)",
    accent: colors.gold,
    fontSans: `"Instrument Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`,
    fontDisplay: `Fraunces, ui-serif, Georgia, "Times New Roman", serif`,
  };
  probe.remove();
  return theme;
}
