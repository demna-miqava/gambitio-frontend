import { describe, expect, it } from "vitest";
import type { SeriesSummary } from "../types";
import {
  formatPoints,
  formatScoreline,
  nextGameLabel,
  playersFor,
  seriesOutcomeFor,
  seriesStatusLabel,
} from "./seriesFormat";

const series = (overrides: Partial<SeriesSummary> = {}): SeriesSummary => ({
  id: 1,
  createdAt: "2026-11-13T10:00:00Z",
  bestOf: 3,
  time: 180,
  increment: 0,
  status: "active",
  endReason: null,
  endedAt: null,
  winnerId: null,
  gamesPlayed: 1,
  playerOne: { id: 1, username: "alice", avatarUrl: null, score: 0.5 },
  playerTwo: { id: 2, username: "bobby", avatarUrl: null, score: 0.5 },
  next: { number: 2, whiteId: 2, blackId: 1 },
  ...overrides,
});

describe("formatPoints", () => {
  it("uses the half-point glyph", () => {
    expect(formatPoints(0)).toBe("0");
    expect(formatPoints(0.5)).toBe("½");
    expect(formatPoints(1)).toBe("1");
    expect(formatPoints(2.5)).toBe("2½");
  });
});

describe("scoreline and players", () => {
  it("puts the viewer first", () => {
    const s = series({
      playerOne: { id: 1, username: "alice", avatarUrl: null, score: 1.5 },
      playerTwo: { id: 2, username: "bobby", avatarUrl: null, score: 0.5 },
    });
    const [first, second] = playersFor(s, 2);
    expect(first.username).toBe("bobby");
    expect(formatScoreline(first, second)).toBe("½–1½");
    expect(playersFor(s, 99)[0].username).toBe("alice");
  });
});

describe("seriesStatusLabel", () => {
  it("names the game in progress", () => {
    expect(seriesStatusLabel(series())).toBe("Game 2 of 3");
  });

  it("names the winner, from the viewer's side", () => {
    const won = series({ status: "finished", winnerId: 1, endReason: "played_out", next: null });
    expect(seriesStatusLabel(won)).toBe("alice won the series");
    expect(seriesStatusLabel(won, 1)).toBe("You won the series");
  });

  it("says who resigned", () => {
    const resigned = series({ status: "finished", winnerId: 1, endReason: "resignation", next: null });
    expect(seriesStatusLabel(resigned)).toBe("bobby resigned the series");
    expect(seriesStatusLabel(resigned, 2)).toBe("You resigned the series");
  });

  it("handles a drawn series", () => {
    expect(seriesStatusLabel(series({ status: "finished", next: null }))).toBe("Drawn series");
  });

  it("says when a series expired", () => {
    const led = series({ status: "finished", winnerId: 1, endReason: "expired", next: null });
    expect(seriesStatusLabel(led)).toBe("alice won the series on points (expired)");
    expect(seriesStatusLabel(led, 1)).toBe("You won the series on points (expired)");
    expect(seriesStatusLabel(series({ status: "finished", endReason: "expired", next: null }))).toBe(
      "Drawn series (expired)"
    );
  });
});

describe("seriesOutcomeFor", () => {
  it("is from the player's side and null for others", () => {
    const done = series({ status: "finished", winnerId: 2, next: null });
    expect(seriesOutcomeFor(done, 2)).toBe("won");
    expect(seriesOutcomeFor(done, 1)).toBe("lost");
    expect(seriesOutcomeFor(done, 3)).toBeNull();
    expect(seriesOutcomeFor(series(), 1)).toBe("active");
    expect(seriesOutcomeFor(series({ status: "finished", next: null }), 1)).toBe("drawn");
  });
});

describe("nextGameLabel", () => {
  it("says who has white next", () => {
    expect(nextGameLabel(series(), 2)).toBe("You play white in game 2");
    expect(nextGameLabel(series(), 1)).toBe("You play black in game 2");
    expect(nextGameLabel(series())).toBe("bobby plays white in game 2");
    expect(nextGameLabel(series({ next: null }))).toBeNull();
  });
});
