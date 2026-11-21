import type { Config } from "@lichess-org/chessground/config";
import { useSettings } from "@/features/settings/SettingsContext";
import type { Settings } from "@/features/settings/types";

/**
 * Fallbacks while settings load, matching the user_settings column defaults
 * on the server (what a new account gets).
 */
export const BOARD_SETTING_DEFAULTS = {
  boardCoordinatesEnabled: true,
  moveHighlightEnabled: true,
  premovesEnabled: false,
  showLegalMovesEnabled: true,
  autoPromoteToQueenEnabled: false,
} as const;

/** The user's board settings, with the defaults filled in */
export type BoardSettings = {
  coordinates: boolean;
  highlightLastMove: boolean;
  premoves: boolean;
  showDests: boolean;
  autoQueen: boolean;
};

/** The settings that change how the board looks and behaves (not auto-queen, which is the caller's) */
export type BoardLook = Omit<BoardSettings, "autoQueen">;

export const resolveBoardSettings = (settings: Settings | undefined): BoardSettings => ({
  coordinates: settings?.boardCoordinatesEnabled ?? BOARD_SETTING_DEFAULTS.boardCoordinatesEnabled,
  highlightLastMove: settings?.moveHighlightEnabled ?? BOARD_SETTING_DEFAULTS.moveHighlightEnabled,
  premoves: settings?.premovesEnabled ?? BOARD_SETTING_DEFAULTS.premovesEnabled,
  showDests: settings?.showLegalMovesEnabled ?? BOARD_SETTING_DEFAULTS.showLegalMovesEnabled,
  autoQueen: settings?.autoPromoteToQueenEnabled ?? BOARD_SETTING_DEFAULTS.autoPromoteToQueenEnabled,
});

/** The user's board settings (defaults until they load) */
export const useBoardSettings = (): BoardSettings => resolveBoardSettings(useSettings().settings);

/**
 * `config` with the board settings applied on top: coordinates, last-move
 * highlight, premoves and legal-move dots. The rest of `config` (including
 * the rest of `movable`) is kept, so this works both for creating a board
 * and, with an empty config, for updating one through cg.set.
 */
export const withBoardSettings = (config: Config, settings: BoardLook): Config => ({
  ...config,
  coordinates: settings.coordinates,
  highlight: { ...config.highlight, lastMove: settings.highlightLastMove, check: true },
  premovable: { ...config.premovable, enabled: settings.premoves },
  movable: { ...config.movable, showDests: settings.showDests },
});
