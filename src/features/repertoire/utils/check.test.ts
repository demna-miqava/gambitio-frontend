import { describe, expect, it } from "vitest";
import type { RepertoireGameCheck } from "@/services/repertoire";
import { describeCheck, listMoves, summarizeChecks } from "./check";

const game = (overrides: Partial<RepertoireGameCheck>): RepertoireGameCheck => ({
  gameId: 1,
  createdAt: "2026-01-01T00:00:00Z",
  color: "white",
  opponent: { id: 2, username: "bobby" },
  result: "white_win",
  outcome: "win",
  botId: null,
  status: "followed",
  pliesInBook: 4,
  divergence: null,
  ...overrides,
});

const divergence = {
  ply: 3,
  moveNumber: 2,
  color: "white" as const,
  played: "Bc4",
  expected: ["Nf3", "d4"],
  fen: "",
  lineNames: ["Italian"],
};

describe("repertoire check", () => {
  it("summarises", () => {
    const summary = summarizeChecks([
      game({}),
      game({ status: "you_deviated" }),
      game({ status: "you_deviated" }),
      game({ status: "opponent_deviated" }),
    ]);
    expect(summary).toEqual({ total: 4, followed: 1, youDeviated: 2, opponentDeviated: 1, notCovered: 0 });
  });

  it("lists moves in words", () => {
    expect(listMoves(["Nf3"])).toBe("Nf3");
    expect(listMoves(["Nf3", "d4", "Bc4"])).toBe("Nf3, d4 or Bc4");
  });

  it("describes each status", () => {
    expect(describeCheck(game({}))).toBe("Followed your preparation for 4 moves");
    expect(describeCheck(game({ status: "you_deviated", divergence }))).toBe(
      "You played 2. Bc4; you prepared Nf3 or d4"
    );
    expect(
      describeCheck(
        game({ status: "opponent_deviated", divergence: { ...divergence, color: "black", played: "c5", expected: ["e5"], moveNumber: 1 } })
      )
    ).toBe("bobby played 1... c5; you prepared for e5");
    expect(describeCheck(game({ status: "not_covered", color: "black" }))).toBe("No black lines cover this opening");
  });
});
