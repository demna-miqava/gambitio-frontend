import { describe, expect, it } from "vitest";
import type { Settings } from "@/features/settings/types";
import { BOARD_SETTING_DEFAULTS, resolveBoardSettings, withBoardSettings } from "./useBoardSettings";

const look = { coordinates: false, highlightLastMove: false, premoves: true, showDests: false };

describe("resolveBoardSettings", () => {
  it("uses the server's defaults while settings load", () => {
    expect(resolveBoardSettings(undefined)).toEqual({
      coordinates: BOARD_SETTING_DEFAULTS.boardCoordinatesEnabled,
      highlightLastMove: BOARD_SETTING_DEFAULTS.moveHighlightEnabled,
      premoves: BOARD_SETTING_DEFAULTS.premovesEnabled,
      showDests: BOARD_SETTING_DEFAULTS.showLegalMovesEnabled,
      autoQueen: BOARD_SETTING_DEFAULTS.autoPromoteToQueenEnabled,
    });
  });

  it("follows the user's settings once loaded", () => {
    const settings = {
      boardCoordinatesEnabled: false,
      moveHighlightEnabled: false,
      premovesEnabled: true,
      showLegalMovesEnabled: false,
      autoPromoteToQueenEnabled: true,
    } as Settings;
    expect(resolveBoardSettings(settings)).toEqual({ ...look, autoQueen: true });
  });
});

describe("withBoardSettings", () => {
  it("adds the settings to an empty config (for cg.set)", () => {
    expect(withBoardSettings({}, look)).toEqual({
      coordinates: false,
      highlight: { lastMove: false, check: true },
      premovable: { enabled: true },
      movable: { showDests: false },
    });
  });

  it("keeps the rest of the config, movable included", () => {
    const dests = new Map();
    const config = withBoardSettings(
      { fen: "8/8/8/8/8/8/8/8 w - - 0 1", orientation: "black", movable: { free: false, color: "black", dests } },
      look
    );
    expect(config.fen).toBe("8/8/8/8/8/8/8/8 w - - 0 1");
    expect(config.orientation).toBe("black");
    expect(config.movable).toEqual({ free: false, color: "black", dests, showDests: false });
  });
});
