import { describe, expect, test } from "vitest";
import { gifFileName, gifOrientation, playerLabel, resultLabel } from "./gameInfo";

const game = { whitePlayer: { id: 1 }, blackPlayer: { id: 2 } };

describe("GIF orientation", () => {
  test("players see their own side at the bottom", () => {
    expect(gifOrientation(game, 1)).toBe("white");
    expect(gifOrientation(game, 2)).toBe("black");
  });

  test("everyone else sees white at the bottom", () => {
    expect(gifOrientation(game, 3)).toBe("white");
    expect(gifOrientation(game, undefined)).toBe("white");
  });

  test("a signed-out viewer isn't the bot's (id-less) side", () => {
    const botGame = { whitePlayer: { id: 1 }, blackPlayer: { id: null } };
    expect(gifOrientation(botGame, null)).toBe("white");
    expect(gifOrientation(botGame, undefined)).toBe("white");
  });
});

describe("labels", () => {
  test("file name", () => {
    expect(gifFileName(42)).toBe("gambitio-game-42.gif");
  });

  test("player with rating", () => {
    expect(playerLabel({ username: "alice", rating: 1512.4 })).toBe("alice (1512)");
    expect(playerLabel({ username: "bot", rating: 0 })).toBe("bot");
  });

  test("result and reason", () => {
    expect(resultLabel("white_win", "checkmate")).toBe("1-0 · checkmate");
    expect(resultLabel("black_win", "time")).toBe("0-1 · on time");
    expect(resultLabel("draw", "threefold_repetition")).toBe("½-½ · repetition");
    expect(resultLabel("draw", "some_new_reason")).toBe("½-½ · some new reason");
    expect(resultLabel("white_win", null)).toBe("1-0");
    expect(resultLabel("aborted", "abandonment")).toBe("");
    expect(resultLabel(null, null)).toBe("");
  });
});
