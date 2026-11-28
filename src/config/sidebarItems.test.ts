import { describe, expect, it } from "vitest";
import {
  getBottomNavItems,
  getNavItems,
  isNavItemActive,
  matchesPath,
  navItemLabel,
} from "./sidebarItems";
import { isGameRoute } from "./shell";

const activeTitles = (pathname: string, userId = 1) =>
  getNavItems(userId)
    .filter((item) => isNavItemActive(item, pathname))
    .map((item) => item.title);

describe("matchesPath", () => {
  it("matches the path itself and its sub-paths only", () => {
    expect(matchesPath("/profile/1", "/profile/1")).toBe(true);
    expect(matchesPath("/profile/1/stats", "/profile/1")).toBe(true);
    expect(matchesPath("/profile/12", "/profile/1")).toBe(false);
  });

  it("treats a trailing slash as a plain prefix", () => {
    expect(matchesPath("/game/42", "/game/")).toBe(true);
    expect(matchesPath("/games", "/game/")).toBe(false);
  });
});

describe("isNavItemActive", () => {
  it("highlights the own profile only for that exact user", () => {
    expect(activeTitles("/profile/1")).toEqual(["Profile"]);
    expect(activeTitles("/profile/1/stats")).toEqual(["Profile"]);
    expect(activeTitles("/profile/12")).toEqual([]);
  });

  it("highlights Play for game history, not Profile", () => {
    expect(activeTitles("/profile/1/games")).toEqual(["Play"]);
    // Someone else's games are part of their profile, not your Play section
    expect(activeTitles("/profile/12/games")).toEqual([]);
  });

  it("highlights Play during games", () => {
    expect(activeTitles("/game/5")).toEqual(["Play"]);
    expect(activeTitles("/bot-game")).toEqual(["Play"]);
    expect(activeTitles("/play-bots")).toEqual(["Play"]);
  });

  it("highlights one item per section", () => {
    expect(activeTitles("/home")).toEqual(["Home"]);
    expect(activeTitles("/puzzles/rush")).toEqual(["Train"]);
    expect(activeTitles("/archive/3")).toEqual(["Analysis"]);
    expect(activeTitles("/leaderboard")).toEqual(["Leaderboard"]);
    expect(activeTitles("/watch")).toEqual(["Watch"]);
    expect(activeTitles("/endgames/kq-vs-k")).toEqual(["Train"]);
    expect(activeTitles("/drills")).toEqual(["Train"]);
    expect(activeTitles("/coordinates")).toEqual(["Train"]);
    // Your openings are something you practise, not an analysis tool
    expect(activeTitles("/repertoire")).toEqual(["Train"]);
    expect(activeTitles("/study/4")).toEqual(["Analysis"]);
    expect(activeTitles("/series/2")).toEqual(["Play"]);
    expect(activeTitles("/tournaments")).toEqual(["Tournaments"]);
    expect(activeTitles("/tournaments/7")).toEqual(["Tournaments"]);
  });
});

describe("getBottomNavItems", () => {
  it("keeps the leaderboard in the sidebar but out of the phone bottom bar", () => {
    expect(getNavItems(1).map((item) => item.title)).toContain("Leaderboard");
    expect(getBottomNavItems(1).map((item) => item.title)).not.toContain("Leaderboard");
  });

  it("keeps Watch in the sidebar but out of the phone bottom bar", () => {
    expect(getNavItems(1).map((item) => item.title)).toContain("Watch");
    expect(getBottomNavItems(1).map((item) => item.title)).not.toContain("Watch");
    // The bar has five slots
    expect(getBottomNavItems(1)).toHaveLength(5);
  });
});

describe("isGameRoute", () => {
  it("covers live and bot games only", () => {
    expect(isGameRoute("/game/7")).toBe(true);
    expect(isGameRoute("/bot-game")).toBe(true);
    expect(isGameRoute("/play")).toBe(false);
    expect(isGameRoute("/archive/7")).toBe(false);
  });
});

describe("navItemLabel", () => {
  it("is just the title without challenges", () => {
    expect(navItemLabel("Play")).toBe("Play");
    expect(navItemLabel("Play", 0)).toBe("Play");
  });

  it("adds the challenge count", () => {
    expect(navItemLabel("Play", 1)).toBe("Play, 1 challenge");
    expect(navItemLabel("Play", 3)).toBe("Play, 3 challenges");
  });
});
