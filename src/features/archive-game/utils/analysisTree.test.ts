import { describe, expect, test } from "vitest";
import { Chess } from "chess.js";
import type { AnalysisNode, NodePath } from "../types/analysis.types";
import * as Tree from "./analysisTree";
import { parsePgn, PgnParseError, toPgn } from "./pgn";
import { buildMoveRows } from "./moveRows";

/** Plays SAN moves from `path`, returning the new tree and path. */
function play(root: AnalysisNode, path: NodePath, ...sans: string[]) {
  let state = { root, path };
  for (const san of sans) {
    const move = new Chess(Tree.nodeAt(state.root, state.path).fen).move(san);
    state = Tree.addMove(state.root, state.path, move);
  }
  return state;
}

const mainLine = (root: AnalysisNode) => {
  const sans: string[] = [];
  for (let n = root.children[0]; n; n = n.children[0]) sans.push(n.move!.san);
  return sans;
};

describe("analysis tree", () => {
  test("replaying an existing move reuses it instead of duplicating", () => {
    const a = play(Tree.createRoot(), [], "e4", "e5");
    const b = play(a.root, [], "e4");
    expect(b.root).toBe(a.root);
    expect(b.root.children).toHaveLength(1);
    expect(b.path).toEqual([a.path[0]]);
  });

  test("a different move becomes a variation; a move at the end extends the line", () => {
    const game = play(Tree.createRoot(), [], "e4", "e5");
    const variation = play(game.root, [game.path[0]!], "c5");
    const first = variation.root.children[0]!;
    expect(first.children.map((c) => c.move!.san)).toEqual(["e5", "c5"]);

    // Continuing past the final move extends the main line (old code filed it as an alternative to e5)
    const extended = play(variation.root, game.path, "Nf3");
    expect(mainLine(extended.root)).toEqual(["e4", "e5", "Nf3"]);
  });

  test("variations nest without losing the rest of a line", () => {
    const game = play(Tree.createRoot(), [], "e4", "e5", "Nf3");
    const sicilian = play(game.root, [game.path[0]!], "c5", "Nf3", "d6");
    // Branch inside the variation at move 2... (d6 vs Nc6)
    const nested = play(sicilian.root, sicilian.path.slice(0, 3), "Nc6");
    const c5 = nested.root.children[0]!.children[1]!;
    const nf3 = c5.children[0]!;
    expect(nf3.children.map((c) => c.move!.san)).toEqual(["d6", "Nc6"]);
    expect(Tree.isMainLine(nested.root, nested.path)).toBe(false);
    expect(Tree.mainLineAncestor(nested.root, nested.path)).toEqual([game.path[0]]);
  });

  test("promote moves a variation up one level, delete removes it", () => {
    const game = play(Tree.createRoot(), [], "e4", "e5");
    const v = play(game.root, [game.path[0]!], "c5");
    const promoted = Tree.promoteVariation(v.root, v.path);
    expect(mainLine(promoted)).toEqual(["e4", "c5"]);

    const deleted = Tree.deleteNode(v.root, v.path);
    expect(deleted.children[0]!.children.map((c) => c.move!.san)).toEqual(["e5"]);
  });

  test("pruneToGame keeps only the original game", () => {
    const { root } = parsePgn("1. e4 e5 2. Nf3");
    const withAnalysis = play(root, [root.children[0]!.id], "c5").root;
    expect(Tree.hasAnalysis(withAnalysis)).toBe(true);
    const pruned = Tree.pruneToGame(withAnalysis);
    expect(Tree.hasAnalysis(pruned)).toBe(false);
    expect(mainLine(pruned)).toEqual(["e4", "e5", "Nf3"]);
  });

  test("clearAnalysis keeps a surviving position, else goes to the branch point; undo restores", () => {
    const { root } = parsePgn("1. e4 e5 2. Nf3");
    const e4 = root.children[0]!;
    const onGame = [e4.id, e4.children[0]!.id];
    const v = play(root, [e4.id], "c5", "Nf3");

    const fromGame = Tree.clearAnalysis(v.root, onGame);
    expect(fromGame.path).toEqual(onGame);

    const fromVariation = Tree.clearAnalysis(v.root, v.path);
    expect(Tree.hasAnalysis(fromVariation.root)).toBe(false);
    expect(fromVariation.path).toEqual([e4.id]);
    // Undo is putting the old tree and path back: they're untouched
    expect(Tree.nodeAt(v.root, v.path).move!.san).toBe("Nf3");
    expect(Tree.hasAnalysis(v.root)).toBe(true);
  });

  test("clearAnalysis on a free board (no game) removes every move", () => {
    const v = play(Tree.createRoot(), [], "d4", "d5", "c4");
    const cleared = Tree.clearAnalysis(v.root, v.path);
    expect(cleared.root.children).toEqual([]);
    expect(cleared.path).toEqual([]);
  });

  test("restored analysis marks only real game moves, even after a promotion", () => {
    const game = parsePgn("1. e4 e5 2. Nf3").root;
    const promoted = Tree.promoteVariation(
      ...((): [AnalysisNode, NodePath] => {
        const v = play(game, [game.children[0]!.id], "c5");
        return [v.root, v.path];
      })()
    );
    const restored = Tree.markGameMoves(parsePgn(toPgn(promoted)).root, game);
    expect(mainLine(Tree.pruneToGame(restored))).toEqual(["e4", "e5", "Nf3"]);
  });

  test("ply and move numbers follow the start position", () => {
    const blackToMove = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    const root = Tree.createRoot(blackToMove);
    expect(root.ply).toBe(1);
    const { root: after } = play(root, [], "e5");
    const e5 = after.children[0]!;
    expect(Tree.isWhiteMove(e5)).toBe(false);
    expect(Tree.moveLabel(e5)).toBe("1... e5");
  });
});

describe("PGN", () => {
  test("parses nested variations, comments, NAGs and annotations", () => {
    const { root, headers } = parsePgn(`[White "A"]
[Black "B"]

1. e4 {best by test} e5 (1... c5 2. Nf3 (2. c3 d5) 2... d6) 2. Nf3!? $1 Nc6 *`);
    expect(headers).toEqual({ White: "A", Black: "B" });
    expect(mainLine(root)).toEqual(["e4", "e5", "Nf3", "Nc6"]);
    const e4 = root.children[0]!;
    const c5 = e4.children[1]!;
    expect(c5.move!.san).toBe("c5");
    expect(c5.isGameMove).toBe(false);
    expect(c5.children[0]!.children.map((c) => c.move!.san)).toEqual(["d6"]);
    expect(c5.children.map((c) => c.move!.san)).toEqual(["Nf3", "c3"]);
  });

  test("round-trips with variations and move numbers in the right places", () => {
    const pgn = "1. e4 e5 (1... c5 2. Nf3 (2. c3 d5) 2... d6) 2. Nf3 Nc6 *";
    expect(toPgn(parsePgn(pgn).root)).toBe(pgn);
  });

  test("supports FEN setups", () => {
    const pgn = `[SetUp "1"]
[FEN "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1"]

1. e4 Kd7 *`;
    const { root } = parsePgn(pgn);
    expect(root.fen).toBe("4k3/8/8/8/8/8/4P3/4K3 w - - 0 1");
    expect(mainLine(root)).toEqual(["e4", "Kd7"]);
    expect(toPgn(root)).toContain('[FEN "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1"]');
  });

  test("reports illegal moves and broken structure", () => {
    expect(() => parsePgn("1. e4 e4")).toThrow(new PgnParseError("Illegal move 1... e4"));
    expect(() => parsePgn("1. e4 (1. d4")).toThrow(PgnParseError);
    expect(() => parsePgn("( 1. e4 )")).toThrow(PgnParseError);
  });

  test("accepts castling written with zeros", () => {
    const { root } = parsePgn("1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. 0-0");
    expect(mainLine(root).at(-1)).toBe("O-O");
  });
});

describe("move list rows", () => {
  const describeRows = (pgn: string) =>
    buildMoveRows(parsePgn(pgn).root).map((row) =>
      row.kind === "moves"
        ? `${row.number}. ${row.white?.node.move!.san ?? "…"} ${row.black?.node.move!.san ?? ""}`.trim()
        : `(${row.alternatives.map((a) => a.node.move!.san).join(", ")})`
    );

  test("pairs moves, and breaks the pair after a white move that has alternatives", () => {
    expect(describeRows("1. e4 (1. d4 d5) 1... e5 2. Nf3 Nc6 (2... d6) 3. Bb5")).toEqual([
      "1. e4",
      "(d4)",
      "1. … e5",
      "2. Nf3 Nc6",
      "(d6)",
      "3. Bb5",
    ]);
  });

  test("starts with a black move after a FEN with black to move", () => {
    expect(
      describeRows(`[FEN "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"]

1... e5 2. Nf3`)
    ).toEqual(["1. … e5", "2. Nf3"]);
  });
});
