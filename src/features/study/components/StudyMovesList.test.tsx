import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { StudyState } from "../types";
import { StudyMovesList } from "./StudyMovesList";

const node = (id: string, parentId: string | null, san: string | null, uci: string | null, ply: number, children: string[] = [], comment = "") => ({
  id, parentId, san, uci, fen: "", ply, children, comment, shapes: [],
});

describe("StudyMovesList", () => {
  it("shows the main line, variations, the current move and comments", () => {
    const state: StudyState = {
      nodes: {
        root: node("root", null, null, null, 0, ["n1", "n3"]),
        n1: node("n1", "root", "e4", "e2e4", 1, ["n2"], "Best by test"),
        n2: node("n2", "n1", "e5", "e7e5", 2),
        n3: node("n3", "root", "d4", "d2d4", 1),
      },
      cursor: "n2",
      nextId: 4,
    };
    const html = renderToStaticMarkup(<StudyMovesList state={state} onGoTo={() => {}} />);
    expect(html).toContain('aria-label="1. e4, has a comment"');
    expect(html).toMatch(/aria-label="1\.\.\. e5" aria-current="step"/);
    expect(html).toContain('aria-label="Variations"');
    expect(html).toContain(">d4<");
  });

  it("says when there are no moves", () => {
    const state: StudyState = { nodes: { root: node("root", null, null, null, 0) }, cursor: "root", nextId: 1 };
    expect(renderToStaticMarkup(<StudyMovesList state={state} onGoTo={() => {}} />)).toContain("No moves yet");
  });
});
