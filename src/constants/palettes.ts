/**
 * The colour palettes a user can pick in Settings → Interface. The colours
 * themselves live in src/index.css (:root/.dark for the default, then one
 * block per palette keyed on <html data-palette="…">); the hex values here
 * mirror them for the picker's swatches and the browser chrome.
 */
export type PaletteId = "emerald" | "club" | "midnight" | "walnut";

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
// pre-paint script in index.html reads
export const PALETTE_STORAGE_KEY = "palette";

export const PALETTES: Palette[] = [
  {
    id: "emerald",
    label: "Emerald & gold",
    description: "Jewel green with gold and cream accents",
    light: {
      background: "#f6f3ea",
      primary: "#006849",
      gold: "#c48d25",
      cream: "#f9efd8",
      boardLight: "#efe8d6",
      boardDark: "#7c9a88",
    },
    dark: {
      background: "#07130f",
      primary: "#007655",
      gold: "#e4b65c",
      cream: "#f0e4c7",
      boardLight: "#ddd5c0",
      boardDark: "#668472",
    },
  },
  {
    id: "club",
    label: "Club green",
    description: "Calm forest green and brass",
    light: {
      background: "#f6f2ea",
      primary: "#156b4a",
      gold: "#ba7e2d",
      boardLight: "#eee6d2",
      boardDark: "#6a8f76",
    },
    dark: {
      background: "#13100d",
      primary: "#277a55",
      gold: "#e5b562",
      boardLight: "#d8cfba",
      boardDark: "#5b7c66",
    },
  },
  {
    id: "midnight",
    label: "Midnight & brass",
    description: "Deep navy, ivory and brass",
    light: {
      background: "#f5f2ec",
      primary: "#1d355b",
      gold: "#b97f2b",
      boardLight: "#ece4d2",
      boardDark: "#7489a0",
    },
    dark: {
      background: "#0b101b",
      primary: "#dcaf61",
      gold: "#e1b767",
      boardLight: "#dcd4c1",
      boardDark: "#5a7290",
    },
  },
  {
    id: "walnut",
    label: "Walnut & cognac",
    description: "Wooden board and warm leather",
    light: {
      background: "#f9f1e9",
      primary: "#753a22",
      gold: "#bf8532",
      boardLight: "#ecd8b4",
      boardDark: "#a77a52",
    },
    dark: {
      background: "#160f0b",
      primary: "#a55a37",
      gold: "#e5b568",
      boardLight: "#d9c39e",
      boardDark: "#8d6443",
    },
  },
];

export const isPaletteId = (value: unknown): value is PaletteId =>
  PALETTES.some((palette) => palette.id === value);

export const getPalette = (id: PaletteId): Palette =>
  PALETTES.find((palette) => palette.id === id) ?? PALETTES[0];
