import { describe, expect, it } from "vitest";
import {
  ArchiveGame,
  CurrentGame,
  Home,
  IntroPage,
  Profile,
  ProfileGames,
  ProfileOverview,
  PuzzleModePage,
  SharedGame,
  StudyRoom,
  Tournament,
  Tournaments,
  isConstrainedConnection,
  pagesForPath,
} from "./pages";

describe("pagesForPath", () => {
  it("finds the page each route renders", () => {
    expect(pagesForPath("/")).toEqual([IntroPage]);
    expect(pagesForPath("/home")).toEqual([Home]);
    expect(pagesForPath("/game/12")).toEqual([CurrentGame]);
    expect(pagesForPath("/archive/12")).toEqual([ArchiveGame]);
    expect(pagesForPath("/puzzles/rush")).toEqual([PuzzleModePage]);
    expect(pagesForPath("/study/3")).toEqual([StudyRoom]);
    expect(pagesForPath("/tournaments")).toEqual([Tournaments]);
    expect(pagesForPath("/tournaments/9")).toEqual([Tournament]);
    expect(pagesForPath("/share/aB3dE6gH9jK2mN")).toEqual([SharedGame]);
  });

  it("includes the profile shell with its tab", () => {
    expect(pagesForPath("/profile/3")).toEqual([Profile, ProfileOverview]);
    expect(pagesForPath("/profile/3/games")).toEqual([Profile, ProfileGames]);
  });

  it("finds nothing for unknown paths", () => {
    expect(pagesForPath("/nope")).toEqual([]);
    expect(pagesForPath("/game/12/extra")).toEqual([]);
  });
});

describe("isConstrainedConnection", () => {
  it("is true with data saver or on 2G/3G", () => {
    expect(isConstrainedConnection({ saveData: true, effectiveType: "4g" })).toBe(true);
    expect(isConstrainedConnection({ effectiveType: "3g" })).toBe(true);
    expect(isConstrainedConnection({ effectiveType: "2g" })).toBe(true);
    expect(isConstrainedConnection({ effectiveType: "slow-2g" })).toBe(true);
  });

  it("is false on fast connections or without the API", () => {
    expect(isConstrainedConnection({ effectiveType: "4g" })).toBe(false);
    expect(isConstrainedConnection({})).toBe(false);
    expect(isConstrainedConnection(undefined)).toBe(false);
  });
});
