import { afterEach, describe, expect, it, vi } from "vitest";
import {
  countPieces,
  fetchTablebase,
  inTablebase,
  mateInMoves,
  movesKeepingResult,
  outcomeOf,
  type TablebaseResult,
} from "../services/tablebase";
import { formatLine, objectiveNote, suggestedMove, verdictFor, verdictText } from "./analysis";

const KQK = "k7/8/2K5/8/8/8/8/7Q w - - 0 1";
const KQK_BLACK = "k7/8/2K5/8/8/8/8/1Q6 b - - 1 1";

const tb = (overrides: Partial<TablebaseResult>): TablebaseResult => ({
  category: "win",
  dtm: 3,
  moves: [],
  ...overrides,
});

describe("tablebase helpers", () => {
  it("counts pieces and knows what the tablebase covers", () => {
    expect(countPieces(KQK)).toBe(3);
    expect(inTablebase(KQK)).toBe(true);
    expect(inTablebase("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")).toBe(false);
    // Few pieces, but castling rights
    expect(inTablebase("4k3/8/8/8/8/8/8/R3K3 w Q - 0 1")).toBe(false);
  });

  it("treats cursed wins and blessed losses as draws", () => {
    expect(outcomeOf("syzygy-win")).toBe("win");
    expect(outcomeOf("cursed-win")).toBe("draw");
    expect(outcomeOf("blessed-loss")).toBe("draw");
    expect(outcomeOf("maybe-loss")).toBe("loss");
    expect(outcomeOf("unknown")).toBe("unknown");
  });

  it("turns plies to mate into moves", () => {
    expect(mateInMoves(1)).toBe(1);
    expect(mateInMoves(3)).toBe(2);
    expect(mateInMoves(-16)).toBe(8);
    expect(mateInMoves(null)).toBeNull();
  });

  it("finds the moves that keep the result", () => {
    const result = tb({
      category: "win",
      moves: [
        { uci: "h1b1", san: "Qb1", category: "loss", dtm: -2 },
        { uci: "h1h8", san: "Qh8+", category: "loss", dtm: -6 },
        { uci: "h1b7", san: "Qb7+", category: "draw", dtm: null },
      ],
    });
    expect(movesKeepingResult(result).map((m) => m.san)).toEqual(["Qb1", "Qh8+"]);
    const drawn = tb({
      category: "draw",
      moves: [
        { uci: "a1a2", san: "Ka2", category: "win", dtm: 9 },
        { uci: "a1b1", san: "Kb1", category: "draw", dtm: null },
      ],
    });
    expect(movesKeepingResult(drawn).map((m) => m.san)).toEqual(["Kb1"]);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("sends only the position and normalises the reply", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ category: "win", dtm: 3, moves: [{ uci: "h1b1", san: "Qb1", category: "loss" }] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchTablebase(KQK);
    expect(fetchMock.mock.calls[0]![0]).toBe(
      `https://tablebase.lichess.ovh/standard?fen=${encodeURIComponent(KQK)}`
    );
    expect(result).toEqual({
      category: "win",
      dtm: 3,
      moves: [{ uci: "h1b1", san: "Qb1", category: "loss", dtm: null }],
    });
  });

  it("fails on an error status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429 }));
    await expect(fetchTablebase(KQK)).rejects.toThrow("429");
  });
});

describe("formatLine", () => {
  it("numbers the moves", () => {
    expect(formatLine(["h1b1", "a8a7", "b1b7"], KQK)).toBe("1. Qb1 Ka7 2. Qb7#");
  });

  it("starts a black move with an ellipsis", () => {
    expect(formatLine(["a8a7", "b1b7"], KQK_BLACK)).toBe("1… Ka7 2. Qb7#");
  });

  it("stops at an illegal move", () => {
    expect(formatLine(["h1b1", "a8a1"], KQK)).toBe("1. Qb1");
  });
});

describe("verdictFor", () => {
  it("prefers the tablebase, from the player's side", () => {
    expect(verdictFor({ fen: KQK, playerColor: "white", tablebase: tb({ dtm: 3 }), engineLine: null })).toEqual({
      outcome: "win",
      mateIn: 2,
      source: "tablebase",
    });
    // Black to move and lost: the player is winning
    expect(
      verdictFor({ fen: KQK_BLACK, playerColor: "white", tablebase: tb({ category: "loss", dtm: -2 }), engineLine: null })
    ).toEqual({ outcome: "win", mateIn: 1, source: "tablebase" });
  });

  it("falls back to a mate the engine found, and nothing else", () => {
    const line = { score: 100000, mate: 2, pv: ["h1b1"], depth: 20, multipv: 1 };
    expect(verdictFor({ fen: KQK, playerColor: "white", tablebase: null, engineLine: line })).toEqual({
      outcome: "win",
      mateIn: 2,
      source: "engine",
    });
    expect(
      verdictFor({ fen: KQK, playerColor: "white", tablebase: null, engineLine: { ...line, mate: undefined, score: 900 } })
    ).toBeNull();
  });

  it("describes the result and when the objective is out of reach", () => {
    expect(verdictText({ outcome: "win", mateIn: 2, source: "tablebase" })).toBe("Winning: mate in 2 with best play");
    expect(verdictText({ outcome: "draw", mateIn: null, source: "tablebase" })).toBe("A draw with best play");
    const draw = { outcome: "draw", mateIn: null, source: "tablebase" } as const;
    expect(objectiveNote({ type: "checkmate" }, draw)).toMatch(/win is gone/);
    expect(objectiveNote({ type: "draw", surviveMoves: 10 }, draw)).toBeNull();
    expect(objectiveNote({ type: "draw", surviveMoves: 10 }, { ...draw, outcome: "loss" })).toMatch(/draw is gone/);
  });
});

describe("suggestedMove", () => {
  const result = tb({
    moves: [
      { uci: "h1b1", san: "Qb1", category: "loss", dtm: -2 },
      { uci: "h1b7", san: "Qb7+", category: "draw", dtm: null },
    ],
  });

  it("keeps Stockfish's move when it holds the result", () => {
    expect(suggestedMove("h1b1", result)).toBe("h1b1");
    expect(suggestedMove("h1h8", null)).toBe("h1h8");
  });

  it("replaces a move the tablebase knows is wrong", () => {
    expect(suggestedMove("h1b7", result)).toBe("h1b1");
    expect(suggestedMove(undefined, result)).toBe("h1b1");
  });
});
