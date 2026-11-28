/**
 * The two themes a user can pick in Settings → Interface: Graphite (the
 * default, key "emerald") and Walnut. The colours themselves live in
 * src/index.css; the hex values here mirror them for the picker's swatches
 * and the browser chrome. Accounts that saved one of the seven palettes that
 * were removed get the default (isPaletteId fails for them).
 */
export type PaletteId = "emerald" | "walnut";

type PaletteColors = {
  /** Page background, also used for the browser's theme-color */
  background: string;
  /** Filled buttons */
  primary: string;
  gold: string;
  /** A third accent, shown in the swatch when the palette has one */
  cream?: string;
  boardLight: string;
  boardDark: string;
};

export type Palette = {
  id: PaletteId;
  label: string;
  description: string;
  light: PaletteColors;
  dark: PaletteColors;
};

export const DEFAULT_PALETTE: PaletteId = "emerald";

// The device's copy of the account setting (colorPalette); the same key the
// pre-paint script (public/theme-init.js) reads
export const PALETTE_STORAGE_KEY = "palette";

export const PALETTES: Palette[] = [
  {
    id: "emerald",
    label: "Graphite",
    description: "Neutral greys; the wooden board is the only colour",
    light: {
      background: "#f4f4f4",
      primary: "#1b1b1b",
      gold: "#c48d25",
      boardLight: "#d4c5af",
      boardDark: "#855f49",
    },
    dark: {
      background: "#0e0e0e",
      primary: "#dedede",
      gold: "#e4b65c",
      boardLight: "#b5a996",
      boardDark: "#714f3b",
    },
  },
  {
    id: "walnut",
    label: "Walnut",
    description: "Warm greys and walnut brown, made to match the board",
    light: {
      background: "#f8f4ef",
      primary: "#6b4127",
      gold: "#c48d25",
      boardLight: "#d4c5af",
      boardDark: "#855f49",
    },
    dark: {
      background: "#100e0b",
      primary: "#7d4e30",
      gold: "#e4b65c",
      boardLight: "#b5a996",
      boardDark: "#714f3b",
    },
  },
];

export const isPaletteId = (value: unknown): value is PaletteId =>
  PALETTES.some((palette) => palette.id === value);

export const getPalette = (id: PaletteId): Palette =>
  PALETTES.find((palette) => palette.id === id) ?? PALETTES[0];
