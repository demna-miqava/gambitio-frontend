/**
 * The colour palettes a user can pick in Settings → Interface. The colours
 * themselves live in src/index.css (:root/.dark for the default, then one
 * block per palette keyed on <html data-palette="…">); the hex values here
 * mirror them for the picker's swatches and the browser chrome.
 */
export type PaletteId =
  | "emerald"
  | "club"
  | "midnight"
  | "walnut"
  | "ink"
  | "fjord"
  | "plum"
  | "tide"
  | "olive";

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
  },  {
    id: "ink",
    label: "Ink & paper",
    description: "Black ink on white paper, grey squares",
    light: {
      background: "#f7f6f3",
      primary: "#1d1a17",
      gold: "#cda53a",
      boardLight: "#edebe4",
      boardDark: "#9c9b94",
    },
    dark: {
      background: "#272522",
      primary: "#e8e4dc",
      gold: "#deb95c",
      boardLight: "#d6d4cc",
      boardDark: "#84837d",
    },
  },
  {
    id: "fjord",
    label: "Fjord",
    description: "Cool paper, steel blue and slate",
    light: {
      background: "#f0f4f8",
      primary: "#1c5284",
      gold: "#cd9a50",
      boardLight: "#e5eaee",
      boardDark: "#7d98b3",
    },
    dark: {
      background: "#0a1119",
      primary: "#32669a",
      gold: "#e5b568",
      boardLight: "#d3dae0",
      boardDark: "#5f7c99",
    },
  },
  {
    id: "plum",
    label: "Plum & rose",
    description: "Aubergine, blush and dusty mauve",
    light: {
      background: "#faf0f0",
      primary: "#6f2b55",
      gold: "#d39471",
      boardLight: "#f1e4dd",
      boardDark: "#a47f93",
    },
    dark: {
      background: "#160d13",
      primary: "#914373",
      gold: "#ebaf86",
      boardLight: "#dfcfc9",
      boardDark: "#916c81",
    },
  },
  {
    id: "tide",
    label: "Tide & sand",
    description: "Deep teal, sand and sea glass",
    light: {
      background: "#f7f2e8",
      primary: "#0c5a63",
      gold: "#d2a249",
      boardLight: "#ede4cf",
      boardDark: "#6c9a9b",
    },
    dark: {
      background: "#061316",
      primary: "#157079",
      gold: "#e4b65c",
      boardLight: "#dcd3bd",
      boardDark: "#557f82",
    },
  },
  {
    id: "olive",
    label: "Olive grove",
    description: "Earthy olive on linen",
    light: {
      background: "#f5f3e8",
      primary: "#43581b",
      gold: "#ca933e",
      boardLight: "#ebe7cf",
      boardDark: "#8b9a69",
    },
    dark: {
      background: "#10110a",
      primary: "#566c30",
      gold: "#e5b562",
      boardLight: "#d9d4b9",
      boardDark: "#70804f",
    },
  },
];

export const isPaletteId = (value: unknown): value is PaletteId =>
  PALETTES.some((palette) => palette.id === value);

export const getPalette = (id: PaletteId): Palette =>
  PALETTES.find((palette) => palette.id === id) ?? PALETTES[0];
