import { describe, expect, test } from "vitest";
import { parsePgn } from "@/features/archive-game/utils/pgn";
import type { MoveReview, PositionEval, ReviewMove } from "../types";
import { cpWinChance, evalWinChance, mateWinChance, toWinPercent } from "./winChance";
import { computeAccuracy, moveAccuracy, volatilityWeights } from "./accuracy";
import { buildGameReview, classifyMove, formatEval, uciToSan } from "./buildReview";
import { gameFingerprint, gamePositions, getGameLine, terminalEval, toReviewMoves } from "./gameLine";
import { parseBestMove, parseInfoLine, pickFinalInfo } from "./uci";
import { parseStoredEvals } from "./reviewStorage";
import { firstReviewMoment } from "./reviewStart";
import { evalBarValue } from "./evalBar";

const cp = (value: number, bestMove?: string): PositionEval => ({ type: "cp", value, ...(bestMove ? { bestMove } : {}) });

function gameFrom(pgn: string) {
  const { root } = parsePgn(pgn);
  const line = getGameLine(root);
  return { root, line, moves: toReviewMoves(root, line), positions: gamePositions(root, line) };
}

describe("winning chances", () => {
  test("follow Lichess's curve, symmetric around 0", () => {
    expect(cpWinChance(0)).toBe(0);
    expect(cpWinChance(100)).toBeCloseTo(0.1821, 3);
    expect(cpWinChance(-100)).toBeCloseTo(-0.1821, 3);
    expect(cpWinChance(300)).toBeCloseTo(0.5023, 3);
  });

  test("clamp at ±10 pawns", () => {
    expect(cpWinChance(5000)).toBe(cpWinChance(1000));
    expect(cpWinChance(-5000)).toBe(cpWinChance(-1000));
  });

  test("mates count as at least +10 and keep their sign", () => {
    expect(mateWinChance(3)).toBe(cpWinChance(1000));
    expect(mateWinChance(-15)).toBe(cpWinChance(-1000));
    expect(mateWinChance(1)).toBeGreaterThan(0.95);
  });

  test("finished games are exactly won, lost or drawn", () => {
    expect(evalWinChance({ type: "over", result: 1 })).toBe(1);
    expect(evalWinChance({ type: "over", result: -1 })).toBe(-1);
    expect(evalWinChance({ type: "over", result: 0 })).toBe(0);
    expect(toWinPercent(-1)).toBe(0);
    expect(toWinPercent(0.5)).toBe(75);
  });
});

describe("classification", () => {
  test("uses the drop thresholds 0.1 / 0.2 / 0.3 (strictly above)", () => {
    expect(classifyMove(0.31, false)).toBe("blunder");
    expect(classifyMove(0.3, false)).toBe("mistake");
    expect(classifyMove(0.25, false)).toBe("mistake");
    expect(classifyMove(0.15, false)).toBe("inaccuracy");
    expect(classifyMove(0.1, false)).toBe("good");
    expect(classifyMove(0.05, false)).toBe("good");
  });

  test("engine's own move is best even if the next search sees further; no real loss is best", () => {
    expect(classifyMove(0.05, true)).toBe("best");
    expect(classifyMove(0.4, true)).toBe("best");
    expect(classifyMove(0.01, false)).toBe("best");
    expect(classifyMove(0, false)).toBe("best");
  });
});

describe("accuracy", () => {
  test("per move: 100 without loss, Lichess curve otherwise, never below 0", () => {
    expect(moveAccuracy(60, 60)).toBe(100);
    expect(moveAccuracy(40, 70)).toBe(100);
    expect(moveAccuracy(60, 50)).toBeCloseTo(64.58, 1);
    expect(moveAccuracy(100, 0)).toBe(0);
  });

  test("weights: one per move, clamped to [0.5, 12]", () => {
    const flat = volatilityWeights([50, 50, 50, 50, 50]);
    expect(flat).toEqual([0.5, 0.5, 0.5, 0.5]);
    const wild = volatilityWeights([50, 100, 0, 100, 0, 100]);
    expect(wild).toHaveLength(5);
    expect(Math.max(...wild)).toBe(12);
    expect(volatilityWeights([50])).toEqual([]);
  });

  test("perfect play is 100%, a blunder drags the side's accuracy down", () => {
    const steady = computeAccuracy({ whiteWinPercents: [50, 50, 50, 50, 50], movers: ["white", "black", "white", "black"] });
    expect(steady.white).toBe(100);
    expect(steady.black).toBe(100);

    // Black drops from 50% to 90% for white (i.e. 50 → 10 for black) on move 2
    const blunder = computeAccuracy({
      whiteWinPercents: [50, 50, 90, 90, 90],
      movers: ["white", "black", "white", "black"],
    });
    expect(blunder.white).toBe(100);
    expect(blunder.black!).toBeLessThan(40);
    expect(blunder.perMove[1]).toBeCloseTo(moveAccuracy(50, 10), 6);
  });

  test("moves marked perfect score 100 whatever the evaluations say", () => {
    const result = computeAccuracy({ whiteWinPercents: [50, 20], movers: ["white"], perfect: [true] });
    expect(result.perMove).toEqual([100]);
    expect(result.white).toBe(100);
  });

  test("skipped moves don't count; a side with no moves has no accuracy", () => {
    const result = computeAccuracy({
      whiteWinPercents: [50, 10, 10],
      movers: ["white", "black"],
      skip: [true, false],
    });
    expect(result.white).toBeNull();
    expect(result.black).toBe(100);
  });
});

describe("buildGameReview", () => {
  test("scholar's mate: classifies the blunder, credits the mate, totals per player", () => {
    const { moves } = gameFrom("1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#");
    const evals: PositionEval[] = [
      cp(30, "e2e4"),
      cp(30, "e7e5"),
      cp(30, "g1f3"),
      cp(25, "g8f6"),
      cp(20, "d2d3"),
      cp(0, "g7g6"), // Black should defend with ...g6
      { type: "mate", value: 1, bestMove: "h5f7" },
      { type: "over", result: 1 },
    ];
    const review = buildGameReview(moves, evals);

    expect(review.moves.map((m) => m.classification)).toEqual([
      "best", // e4 = engine move
      "best",
      "best", // Bc4 lost nothing
      "best",
      "good", // Qh5 gave up a little
      "blunder", // Nf6?? allows mate
      "best", // Qxf7#
    ]);
    const nf6 = review.moves[5]!;
    expect(nf6.side).toBe("black");
    expect(nf6.bestMoveSan).toBe("g6");
    expect(nf6.winChanceBefore).toBeCloseTo(0, 6);
    expect(nf6.winChanceAfter).toBeLessThan(-0.95);
    expect(review.moves[6]!.winChanceAfter).toBe(1);
    expect(review.moves[6]!.bestMoveSan).toBeUndefined();

    expect(review.black.blunders).toBe(1);
    expect(review.black.mistakes + review.black.inaccuracies).toBe(0);
    expect(review.white.blunders).toBe(0);
    expect(review.white.accuracy!).toBeGreaterThan(95);
    expect(review.black.accuracy!).toBeLessThan(review.white.accuracy!);
  });

  test("the only legal move is never judged and doesn't count for accuracy", () => {
    // After 1. e4 f5 2. Qh5+ black's only legal move is g6
    const { moves } = gameFrom("1. e4 f5 2. Qh5+ g6");
    const evals = [cp(30), cp(100), cp(-200), cp(400), cp(-1000)];
    const review = buildGameReview(moves, evals);
    const g6 = review.moves[3]!;
    expect(g6.forced).toBe(true);
    expect(g6.classification).toBe("best");
    expect(g6.accuracy).toBe(100);
  });

  test("throwing away a win by stalemate is a blunder", () => {
    // White to move; Qb6 stalemates the black king on a8
    const fen = "k7/2K5/8/8/8/8/8/1Q6 w - - 0 1";
    const moves: ReviewMove[] = [{ san: "Qb6", uci: "b1b6", fenBefore: fen }];
    const review = buildGameReview(moves, [{ type: "mate", value: 1, bestMove: "b1b7" }, { type: "over", result: 0 }]);
    expect(review.moves[0]!.classification).toBe("blunder");
    expect(review.moves[0]!.bestMoveSan).toBe("Qb7#");
  });

  test("a horizon effect on the engine's own move isn't held against the player", () => {
    const { moves } = gameFrom("1. e4 e5");
    // Black plays the engine's ...e5, but the deeper look after it is worse for black
    const review = buildGameReview(moves, [cp(30, "e2e4"), cp(30, "e7e5"), cp(400)]);
    expect(review.moves[1]!.classification).toBe("best");
    expect(review.moves[1]!.accuracy).toBe(100);
    expect(review.moves[1]!.bestMoveSan).toBeUndefined();
    expect(review.black.accuracy).toBe(100);
  });

  test("rejects evaluations that don't match the moves", () => {
    const { moves } = gameFrom("1. e4 e5");
    expect(() => buildGameReview(moves, [cp(0)])).toThrow();
  });
});

describe("game line", () => {
  test("follows the game moves even after a variation is promoted", () => {
    const { root } = parsePgn("1. e4 (1. d4 d5) 1... e5 2. Nf3");
    const promoted = { ...root, children: [root.children[1]!, root.children[0]!] };
    expect(getGameLine(promoted).map((e) => e.node.move!.san)).toEqual(["e4", "e5", "Nf3"]);
  });

  test("positions and moves line up", () => {
    const { moves, positions, line } = gameFrom("1. e4 e5");
    expect(positions).toHaveLength(3);
    expect(moves[1]!.fenBefore).toBe(line[0]!.node.fen);
    expect(moves[1]!.uci).toBe("e7e5");
  });

  test("detects positions where the game is over on the board", () => {
    expect(terminalEval("rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3")).toEqual({ type: "over", result: -1 });
    expect(terminalEval("k7/8/1QK5/8/8/8/8/8 b - - 0 1")).toEqual({ type: "over", result: 0 });
    expect(terminalEval("8/8/8/4k3/8/8/8/4K3 w - - 0 1")).toEqual({ type: "over", result: 0 });
    expect(terminalEval("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")).toBeNull();
  });

  test("fingerprint changes with the moves", () => {
    const a = gameFrom("1. e4 e5");
    const b = gameFrom("1. e4 c5");
    expect(gameFingerprint(a.root.fen, a.moves)).toBe(gameFingerprint(a.root.fen, gameFrom("1. e4 e5").moves));
    expect(gameFingerprint(a.root.fen, a.moves)).not.toBe(gameFingerprint(b.root.fen, b.moves));
  });
});

describe("UCI parsing", () => {
  test("reads depth, score, bound and pv", () => {
    expect(parseInfoLine("info depth 12 seldepth 18 multipv 1 score cp -34 nodes 1234 nps 5000 pv e7e5 g1f3")).toEqual({
      depth: 12,
      multipv: 1,
      score: { type: "cp", value: -34 },
      bound: false,
      pv: ["e7e5", "g1f3"],
    });
    expect(parseInfoLine("info depth 9 score mate -3 upperbound pv a2a3")).toMatchObject({
      score: { type: "mate", value: -3 },
      bound: true,
    });
    expect(parseInfoLine("info string NNUE evaluation using nn.bin")).toBeNull();
    expect(parseInfoLine("info depth 3 currmove e2e4 currmovenumber 1")).toBeNull();
    expect(parseInfoLine("readyok")).toBeNull();
  });

  test("reads bestmove, including (none)", () => {
    expect(parseBestMove("bestmove e2e4 ponder e7e5")).toEqual({ move: "e2e4" });
    expect(parseBestMove("bestmove e7e8q")).toEqual({ move: "e7e8q" });
    expect(parseBestMove("bestmove (none)")).toEqual({ move: undefined });
    expect(parseBestMove("info depth 1")).toBeNull();
  });

  test("trusts the deepest exact main line", () => {
    const infos = [
      "info depth 10 multipv 1 score cp 20 pv e2e4",
      "info depth 11 multipv 1 score cp 80 lowerbound pv e2e4",
      "info depth 11 multipv 1 score cp 35 pv d2d4",
      "info depth 11 multipv 2 score cp 10 pv c2c4",
    ].map((l) => parseInfoLine(l)!);
    expect(pickFinalInfo(infos)).toMatchObject({ depth: 11, score: { value: 35 } });
    expect(pickFinalInfo([infos[1]!])).toMatchObject({ depth: 11, bound: true });
    expect(pickFinalInfo([])).toBeUndefined();
  });
});

describe("display and storage", () => {
  test("formats evaluations from white's view", () => {
    expect(formatEval(cp(134))).toBe("+1.3");
    expect(formatEval(cp(-40))).toBe("-0.4");
    expect(formatEval(cp(-3))).toBe("0.0");
    expect(formatEval({ type: "mate", value: -2 })).toBe("-M2");
    expect(formatEval({ type: "over", result: 0 })).toBe("½-½");
    expect(uciToSan("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "g1f3")).toBe("Nf3");
    expect(uciToSan("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "e2e5")).toBeUndefined();
  });

  test("stored evaluations must be well-formed and the right length", () => {
    const evals = [cp(10, "e2e4"), { type: "mate", value: 2 }, { type: "over", result: 1 }];
    expect(parseStoredEvals(JSON.stringify(evals), 3)).toEqual(evals);
    expect(parseStoredEvals(JSON.stringify(evals), 4)).toBeNull();
    expect(parseStoredEvals(JSON.stringify([{ type: "cp", value: "x" }]), 1)).toBeNull();
    expect(parseStoredEvals("not json", 1)).toBeNull();
    expect(parseStoredEvals(null, 1)).toBeNull();
  });
});

describe("where a finished review takes you", () => {
  const move = (index: number, classification: MoveReview["classification"]): MoveReview => ({
    index,
    san: "e4",
    uci: "e2e4",
    side: index % 2 === 0 ? "white" : "black",
    winChanceBefore: 0,
    winChanceAfter: 0,
    drop: 0,
    accuracy: 100,
    classification,
    forced: false,
    evalAfter: cp(0),
  });

  test("the player's first mistake or blunder, ahead of an earlier inaccuracy", () => {
    const moves = [move(0, "inaccuracy"), move(1, "good"), move(2, "blunder"), move(3, "mistake"), move(4, "mistake")];
    expect(firstReviewMoment(moves, "white")).toBe(3);
    expect(firstReviewMoment(moves, "black")).toBe(4);
  });

  test("their first inaccuracy when there's nothing worse", () => {
    const moves = [move(0, "best"), move(1, "blunder"), move(2, "good"), move(3, "good"), move(4, "inaccuracy")];
    expect(firstReviewMoment(moves, "white")).toBe(5);
  });

  test("nowhere when their game is clean", () => {
    const moves = [move(0, "best"), move(1, "blunder"), move(2, "good")];
    expect(firstReviewMoment(moves, "white")).toBeNull();
    expect(firstReviewMoment([], "white")).toBeNull();
  });

  test("either side's first error when no side is given", () => {
    const moves = [move(0, "inaccuracy"), move(1, "mistake"), move(2, "blunder")];
    expect(firstReviewMoment(moves)).toBe(2);
  });
});

describe("review evaluations on the bar", () => {
  test("centipawns are capped so both sides show, unsigned label, signed spoken label", () => {
    expect(evalBarValue(cp(0))).toEqual({ whitePercent: 50, label: "0.0", spokenLabel: "Evaluation 0.0" });
    const black = evalBarValue(cp(-150));
    expect(black.whitePercent).toBeLessThan(50);
    expect(black.label).toBe("1.5");
    expect(black.spokenLabel).toBe("Evaluation -1.5");
    expect(evalBarValue(cp(5000)).whitePercent).toBe(95);
    expect(evalBarValue(cp(-5000)).whitePercent).toBe(5);
  });

  test("mates and finished games fill the bar", () => {
    expect(evalBarValue({ type: "mate", value: 3 })).toMatchObject({ whitePercent: 100, label: "M3" });
    expect(evalBarValue({ type: "mate", value: -2 })).toMatchObject({ whitePercent: 0, label: "M2" });
    expect(evalBarValue({ type: "over", result: -1 })).toMatchObject({ whitePercent: 0, label: "0-1" });
    expect(evalBarValue({ type: "over", result: 0 })).toMatchObject({ whitePercent: 50, label: "½-½" });
  });
});
