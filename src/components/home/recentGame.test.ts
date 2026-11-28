import { describe, expect, it } from "vitest";
import tableJson from "@/features/openings/data/openings.json?raw";
import type { OpeningTable } from "@/features/openings/openings";
import type { StoredGameListItem } from "@/types";
import { formatOfGame, openingOfGame, sideOf } from "./recentGame";
import { playedLabel } from "@/utils/playedLabel";

const table: OpeningTable = JSON.parse(tableJson);

describe("openingOfGame", () => {
  it("names the deepest known position of the game", () => {
    expect(openingOfGame(table, "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2 e5 7. Nb3 Be7")?.name).toMatch(
      /^Sicilian Defense: Najdorf Variation/
    );
    expect(openingOfGame(table, "1. e4 e5")?.name).toBe("King's Pawn Game");
  });

  it("has no name without moves or for a PGN that doesn't load", () => {
    expect(openingOfGame(table, "")).toBeNull();
    expect(openingOfGame(table, null)).toBeNull();
    expect(openingOfGame(table, "1. e4 e5 2. Ke3")).toBeNull();
  });
});

describe("playedLabel", () => {
  const now = new Date(2026, 10, 28, 15, 0, 0);
  const ago = (ms: number) => new Date(now.getTime() - ms);
  const MIN = 60_000;
  const HOUR = 60 * MIN;

  it("says how long ago for today's games", () => {
    expect(playedLabel(ago(20_000), now)).toBe("Just now");
    expect(playedLabel(ago(MIN), now)).toBe("1 minute ago");
    expect(playedLabel(ago(25 * MIN), now)).toBe("25 minutes ago");
    expect(playedLabel(ago(HOUR), now)).toBe("1 hour ago");
    expect(playedLabel(ago(2 * HOUR + 10 * MIN), now)).toBe("2 hours ago");
  });

  it("goes by the calendar day after that", () => {
    // 16 hours ago is last night: yesterday, not "16 hours ago"
    expect(playedLabel(ago(16 * HOUR), now)).toBe("Yesterday");
    expect(playedLabel(ago(3 * 24 * HOUR), now)).toBe("3 days ago");
    expect(playedLabel(new Date(2026, 10, 12, 9), now)).toBe("12 Nov");
    expect(playedLabel(new Date(2025, 11, 31, 9), now)).toBe("31 Dec 2025");
  });
});

describe("formatOfGame and sideOf", () => {
  const game = (over: Partial<StoredGameListItem>) =>
    ({
      type: "blitz",
      time: 180,
      increment: 2,
      botId: null,
      whitePlayer: { id: 1 },
      blackPlayer: { id: 2 },
      ...over,
    }) as StoredGameListItem;

  it("names the speed and the time control", () => {
    expect(formatOfGame(game({}))).toBe("Blitz 3+2");
    expect(formatOfGame(game({ type: null, time: null, botId: "club-bot" }))).toBe("Against a bot");
    expect(formatOfGame(game({ tableGame: true }))).toBe("Table game");
  });

  it("finds the player's side", () => {
    expect(sideOf(game({}), 1)).toBe("white");
    expect(sideOf(game({}), 2)).toBe("black");
    expect(sideOf(game({}), 3)).toBeNull();
    expect(sideOf(game({}), undefined)).toBeNull();
  });
});
