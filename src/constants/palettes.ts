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
      background: "#faf8f1",
      primary: "#006849",
      gold: "#c48d25",
      cream: "#f9efd8",
      boardLight: "#f1e9d4",
      boardDark: "#4f8a70",
    },
    dark: {
      background: "#06120e",
      primary: "#deaf56",
      gold: "#e4b65c",
      cream: "#f0e4c7",
      boardLight: "#e2d8bf",
      boardDark: "#3f7a60",
    },
  },
  {
    id: "club",
    label: "Club green",
    description: "Calm forest green and brass",
    light: {
      background: "#fbf8f1",
      primary: "#156b4a",
      gold: "#ba7e2d",
      boardLight: "#eee6d2",
      boardDark: "#6a8f76",
    },
    dark: {
      background: "#120f0c",
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
      background: "#faf8f3",
      primary: "#1d355b",
      gold: "#b97f2b",
      boardLight: "#ece4d2",
      boardDark: "#7489a0",
    },
    dark: {
      background: "#0a0f1a",
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
      background: "#fdf7f0",
      primary: "#753a22",
      gold: "#bf8532",
      boardLight: "#ecd8b4",
      boardDark: "#a77a52",
    },
    dark: {
      background: "#150e0a",
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
