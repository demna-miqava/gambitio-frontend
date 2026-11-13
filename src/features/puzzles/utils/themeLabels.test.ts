import { describe, expect, it } from "vitest";
import { decamelize, filterThemes, formatThemeLabel, isValidThemeKey } from "./themeLabels";

describe("formatThemeLabel", () => {
  it("uses the Lichess name for known themes", () => {
    expect(formatThemeLabel("fork")).toBe("Fork");
    expect(formatThemeLabel("mateIn2")).toBe("Mate in 2");
    expect(formatThemeLabel("mate")).toBe("Checkmate");
    expect(formatThemeLabel("xRayAttack")).toBe("X-ray attack");
    expect(formatThemeLabel("capturingDefender")).toBe("Capture the defender");
  });

  it("falls back to a de-camelCased key", () => {
    expect(formatThemeLabel("someNewTheme")).toBe("Some new theme");
    expect(formatThemeLabel("mateIn6")).toBe("Mate in 6");
  });
});

describe("decamelize", () => {
  it("splits camelCase, digits and acronyms", () => {
    expect(decamelize("backRankMate")).toBe("Back rank mate");
    expect(decamelize("attackingF2F7")).toBe("Attacking f 2 f 7");
    expect(decamelize("superGM")).toBe("Super GM");
    expect(decamelize("GMGames")).toBe("GM games");
    expect(decamelize("in3Moves")).toBe("In 3 moves");
    expect(decamelize("snake_case-key")).toBe("Snake case key");
    expect(decamelize("")).toBe("");
  });
});

describe("filterThemes", () => {
  const themes = [
    { theme: "fork", count: 5 },
    { theme: "mateIn2", count: 3 },
    { theme: "backRankMate", count: 2 },
  ];

  it("returns everything for an empty query", () => {
    expect(filterThemes(themes, "  ")).toBe(themes);
  });

  it("matches labels and keys case-insensitively", () => {
    expect(filterThemes(themes, "MATE").map((t) => t.theme)).toEqual(["mateIn2", "backRankMate"]);
    expect(filterThemes(themes, "mate in").map((t) => t.theme)).toEqual(["mateIn2"]);
    expect(filterThemes(themes, "rankmate").map((t) => t.theme)).toEqual(["backRankMate"]);
    expect(filterThemes(themes, "zzz")).toEqual([]);
  });
});

describe("isValidThemeKey", () => {
  it("accepts alphanumeric keys only", () => {
    expect(isValidThemeKey("mateIn2")).toBe(true);
    expect(isValidThemeKey("")).toBe(false);
    expect(isValidThemeKey(null)).toBe(false);
    expect(isValidThemeKey("a b")).toBe(false);
    expect(isValidThemeKey("x".repeat(41))).toBe(false);
  });
});
