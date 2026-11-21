import { describe, expect, it } from "vitest";
import {
  dueLabel,
  formatMoves,
  groupLines,
  lastMoverColor,
  lineAccuracy,
  parseMoveText,
  practiceOrder,
} from "./lines";

describe("formatMoves", () => {
  it("numbers White's moves", () => {
    expect(formatMoves(["e4", "e5", "Nf3"])).toBe("1. e4 e5 2. Nf3");
    expect(formatMoves([])).toBe("");
  });
});

describe("lastMoverColor", () => {
  it("is the side that made the last move", () => {
    expect(lastMoverColor(["e4"])).toBe("white");
    expect(lastMoverColor(["e4", "c5"])).toBe("black");
  });
});

describe("parseMoveText", () => {
  it("reads numbered, bare and PGN movetext", () => {
    expect(parseMoveText("1. e4 e5 2. Nf3")).toEqual({ ok: true, moves: ["e4", "e5", "Nf3"] });
    expect(parseMoveText("e4 c5 Ng1f3")).toEqual({ ok: true, moves: ["e4", "c5", "Nf3"] });
    expect(parseMoveText("1.d4 {main} d5 (1... Nf6) 2.c4!? $1 *")).toEqual({
      ok: true,
      moves: ["d4", "d5", "c4"],
    });
    expect(parseMoveText("1. e4 e5 2. Nf3 2... Nc6")).toEqual({ ok: true, moves: ["e4", "e5", "Nf3", "Nc6"] });
  });

  it("reads a pasted PGN: headers, nested variations and spaced-out black moves", () => {
    const pgn = '[Event "Casual"]\n[White "A"]\n\n1. e4 (1. d4 d5 (1... Nf6 2. c4) 2. c4) 1... c5 2. Nf3 ... d6 *';
    expect(parseMoveText(pgn)).toEqual({ ok: true, moves: ["e4", "c5", "Nf3", "d6"] });
    expect(parseMoveText("1. e4 ... e5")).toEqual({ ok: true, moves: ["e4", "e5"] });
  });

  it("names the first illegal move", () => {
    expect(parseMoveText("1. e4 e5 2. Ke3")).toEqual({ ok: false, message: "2. Ke3 isn't a legal move there." });
    expect(parseMoveText("e4 e5 Nf3 Nf3")).toEqual({ ok: false, message: "2... Nf3 isn't a legal move there." });
    expect(parseMoveText("   ").ok).toBe(false);
  });
});

describe("practice", () => {
  const line = (id: number, dueAt: string, practiceAttempts = 0) => ({ id, dueAt, practiceAttempts });

  it("orders overdue lines first, then the least practised", () => {
    const order = practiceOrder([
      line(1, "2026-01-05T00:00:00Z"),
      line(2, "2026-01-01T00:00:00Z", 3),
      line(3, "2026-01-01T00:00:00Z", 1),
    ]);
    expect(order.map((l) => l.id)).toEqual([3, 2, 1]);
  });

  it("reports accuracy and due dates", () => {
    expect(lineAccuracy({ practiceAttempts: 0, practiceCorrect: 0 })).toBeNull();
    expect(lineAccuracy({ practiceAttempts: 4, practiceCorrect: 3 })).toBe(0.75);
    const now = new Date("2026-01-01T12:00:00Z").getTime();
    expect(dueLabel("2026-01-01T00:00:00Z", now)).toBe("Due now");
    expect(dueLabel("2026-01-02T06:00:00Z", now)).toBe("Due tomorrow");
    expect(dueLabel("2026-01-05T12:00:00Z", now)).toBe("Due in 4 days");
  });
});

describe("groupLines", () => {
  it("groups White by first move and Black by the move answered", () => {
    const groups = groupLines([
      { color: "white" as const, moves: ["e4", "e5", "Nf3"] },
      { color: "white" as const, moves: ["d4", "d5"] },
      { color: "white" as const, moves: ["e4", "c5"] },
      { color: "black" as const, moves: ["d4", "Nf6"] },
    ]);
    expect(groups.map((g) => g.title)).toEqual(["1. d4", "1. e4", "Against 1. d4"]);
    expect(groups[1]!.lines.map((l) => l.moves[1])).toEqual(["c5", "e5"]);
  });
});
