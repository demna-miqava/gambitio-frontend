import { describe, expect, it } from "vitest";
import { parsePgn } from "./pgn";

const mainline = (pgn: string): string[] => {
  const sans: string[] = [];
  let node = parsePgn(pgn).root.children[0];
  while (node) {
    sans.push(node.move!.san);
    node = node.children[0];
  }
  return sans;
};

describe("parsePgn", () => {
  it("reads headers, comments and variations", () => {
    const pgn = `[White "Ann"]\n[Black "Bob \\"B\\""]\n\n1. e4 {best by test} e5 (1... c5 2. Nf3) 2. Nf3 ; the usual\nNc6 1-0`;
    const { headers, root } = parsePgn(pgn);
    expect(headers).toMatchObject({ White: "Ann", Black: 'Bob "B"' });
    expect(mainline(pgn)).toEqual(["e4", "e5", "Nf3", "Nc6"]);
    expect(root.children[0]!.children.map((n) => n.move!.san)).toEqual(["e5", "c5"]);
  });

  it("reads a black move spaced out after its number", () => {
    expect(mainline("1. e4 {comment} 1. ... e5 2. Nf3")).toEqual(["e4", "e5", "Nf3"]);
  });

  it("takes a comment that is never closed as running to the end", () => {
    expect(mainline("1. e4 e5 {and so on")).toEqual(["e4", "e5"]);
  });

  // Each of these took many seconds (quadratic time) before the patterns
  // were tightened: a pasted text must not freeze the tab
  it("stays fast on text made to be slow to scan", () => {
    const started = performance.now();
    expect(mainline(`1. e4 ${"{".repeat(200_000)}`)).toEqual(["e4"]);
    expect(mainline(`${"\n".repeat(200_000)}1. e4`)).toEqual(["e4"]);
    expect(mainline(`${" \n".repeat(100_000)}[White "Ann"]\n1. d4`)).toEqual(["d4"]);
    expect(performance.now() - started).toBeLessThan(2_000);
  });
});
