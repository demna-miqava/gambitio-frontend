import { describe, expect, it } from "vitest";
import { clockOffset, duelOutcome, formatDuelClock, positionAfter, secondsLeft, solverColor, splitPlayers } from "./duel";

describe("puzzle duel helpers", () => {
  it("works out the server's clock from a round trip", () => {
    // Sent at 1000, answered at 1200: the server's 5100 was at our 1100
    expect(clockOffset(5100, 1000, 1200)).toBe(4000);
  });

  it("counts seconds down and formats them", () => {
    expect(secondsLeft(10_000, 0)).toBe(10);
    expect(secondsLeft(10_000, 9_001)).toBe(1);
    expect(secondsLeft(10_000, 12_000)).toBe(0);
    expect(formatDuelClock(180)).toBe("3:00");
    expect(formatDuelClock(65)).toBe("1:05");
  });

  it("replays the moves played in a puzzle", () => {
    const start = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    expect(positionAfter(start, ["e2e4", "e7e5"]).fen().split(" ")[0]).toBe(
      "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR"
    );
    // An illegal move stops the replay
    expect(positionAfter(start, ["e2e5"]).fen()).toBe(start);
    expect(solverColor(start)).toBe("white");
    expect(solverColor("8/8/8/8/8/8/8/K6k b - - 0 1")).toBe("black");
  });

  it("tells the viewer apart, and how it ended for them", () => {
    const players = [
      { userId: 1, username: "a", avatarUrl: null, score: 3, strikes: 0, out: false },
      { userId: 2, username: "b", avatarUrl: null, score: 1, strikes: 3, out: true },
    ];
    expect(splitPlayers(players, 2).me?.username).toBe("b");
    expect(splitPlayers(players, 2).opponent?.username).toBe("a");
    expect(duelOutcome(null, 1)).toBe("draw");
    expect(duelOutcome(1, 1)).toBe("win");
    expect(duelOutcome(1, 2)).toBe("loss");
  });
});
