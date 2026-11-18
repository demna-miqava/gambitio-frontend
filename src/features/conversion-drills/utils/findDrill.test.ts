import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import type { PositionEval } from "@/features/game-review/types";
import { findDrill, formatDrillEval, isClearlyWinning, playerEval, playerPositions } from "./findDrill";

const pgnOf = (moves: string) => {
  const chess = new Chess();
  for (const san of moves.split(" ")) chess.move(san);
  return chess.pgn();
};

const cp = (value: number): PositionEval => ({ type: "cp", value });

describe("playerPositions", () => {
  it("lists the positions where the player is to move, with their ply", () => {
    const pgn = pgnOf("e4 e5 Nf3 Nc6 Bb5");
    expect(playerPositions(pgn, "white").map((p) => p.ply)).toEqual([0, 2, 4]);
    expect(playerPositions(pgn, "black").map((p) => p.ply)).toEqual([1, 3]);
    expect(playerPositions(pgn, "black")[0]!.fen).toBe(new Chess("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1").fen());
  });

  it("is empty for a PGN that doesn't load", () => {
    expect(playerPositions("1. e4 Ke3", "white")).toEqual([]);
  });
});

describe("evaluations from the player's side", () => {
  it("flips for black and keeps mates", () => {
    expect(playerEval(cp(-450), "black")).toEqual({ cp: 450 });
    expect(playerEval({ type: "mate", value: 3 }, "white")).toEqual({ mate: 3 });
    expect(playerEval({ type: "over", result: 1 }, "white")).toBeNull();
    expect(isClearlyWinning({ cp: 300 })).toBe(true);
    expect(isClearlyWinning({ cp: 299 })).toBe(false);
    expect(isClearlyWinning({ mate: -2 })).toBe(false);
    expect(formatDrillEval({ cp: 420 })).toBe("+4.2");
    expect(formatDrillEval({ mate: 5 })).toBe("mate in 5");
  });
});

describe("findDrill", () => {
  const positions = [0, 2, 4, 6, 8, 10].map((ply) => ({ ply, fen: `fen-${ply}` }));
  const evaluator = (byPly: Record<number, PositionEval>) => {
    const asked: string[] = [];
    const evaluate = async (fen: string) => {
      asked.push(fen);
      return byPly[Number(fen.slice(4))] ?? cp(0);
    };
    return { asked, evaluate };
  };

  it("picks the start of the first lasting lead and stops there", async () => {
    // A one-move spike at ply 2 (a tactic) doesn't count; 6 and 8 do
    const { asked, evaluate } = evaluator({ 2: cp(900), 6: cp(350), 8: cp(500), 10: cp(800) });
    expect(await findDrill(positions, "white", evaluate)).toEqual({ ply: 6, eval: { cp: 350 } });
    expect(asked).toEqual(["fen-0", "fen-2", "fen-4", "fen-6", "fen-8"]);
  });

  it("reads evaluations from black's side", async () => {
    const { evaluate } = evaluator({ 4: { type: "mate", value: -4 }, 6: cp(-600) });
    expect(await findDrill(positions, "black", evaluate)).toEqual({ ply: 4, eval: { mate: 4 } });
  });

  it("finds nothing in a game that was never clearly won", async () => {
    const { evaluate } = evaluator({ 2: cp(250), 4: cp(280), 8: cp(900) });
    expect(await findDrill(positions, "white", evaluate)).toBeNull();
  });

  it("stops when cancelled", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(findDrill(positions, "white", evaluator({}).evaluate, controller.signal)).rejects.toThrow(
      "Scan cancelled"
    );
  });
});
