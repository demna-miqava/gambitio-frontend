import { ROUTES, getPuzzleModeRoute } from "@/constants/routes";

/** Copy and links for a game-rating leaderboard (bullet/blitz/rapid). */
const gameVariant = (label: string) => ({
  label,
  /** Header of the activity-count column */
  countLabel: "Games",
  /** How to get listed, completing "Friends show up here once they …" */
  howToRank: `finish a rated ${label.toLowerCase()} game`,
  cta: { label: "Play a game", to: ROUTES.PLAY },
});

/**
 * Leaderboard tabs, in display order. `value` is the API's `variant`
 * parameter (backend: LEADERBOARD_VARIANTS in src/models/Leaderboard.ts).
 * Adding a variant is one entry here.
 */
export const LEADERBOARD_VARIANTS = [
  { value: "bullet", ...gameVariant("Bullet") },
  { value: "blitz", ...gameVariant("Blitz") },
  { value: "rapid", ...gameVariant("Rapid") },
  {
    value: "puzzle",
    label: "Puzzles",
    countLabel: "Puzzles",
    howToRank: "try a puzzle in Infinite mode",
    cta: { label: "Solve puzzles", to: getPuzzleModeRoute("infinite") },
  },
] as const;

export type LeaderboardVariant = (typeof LEADERBOARD_VARIANTS)[number]["value"];
export type LeaderboardVariantInfo = (typeof LEADERBOARD_VARIANTS)[number];

export const DEFAULT_LEADERBOARD_VARIANT: LeaderboardVariant = "blitz";
export const LEADERBOARD_PAGE_SIZE = 25;
