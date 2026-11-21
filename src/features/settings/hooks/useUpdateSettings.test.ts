import { describe, expect, it } from "vitest";
import type { Settings } from "../types";
import { undoPatch } from "./useUpdateSettings";

const base = {
  soundsEnabled: true,
  premovesEnabled: true,
  showLegalMovesEnabled: false,
} as Settings;

describe("undoPatch", () => {
  it("puts back only what the failed change set", () => {
    // Sounds off failed; premoves off (a second toggle) is still being saved
    const current = { ...base, soundsEnabled: false, premovesEnabled: false };
    expect(undoPatch(current, base, { soundsEnabled: false })).toEqual({
      ...base,
      premovesEnabled: false,
    });
  });

  it("leaves a key a later change set again", () => {
    // Legal moves on (failed), then off again: the later value stays
    const previous = { ...base };
    const current = { ...base, showLegalMovesEnabled: false };
    expect(undoPatch(current, previous, { showLegalMovesEnabled: true })).toEqual(current);
  });
});
