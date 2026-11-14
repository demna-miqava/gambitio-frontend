import { describe, expect, test, vi } from "vitest";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { parsePgn } from "@/features/archive-game/utils/pgn";
import { moveLabel } from "@/features/archive-game/utils/analysisTree";
import type { PositionEval } from "../types";
import { buildGameReview } from "../utils/buildReview";
import { getGameLine, toReviewMoves } from "../utils/gameLine";
import { EvalGraph } from "./EvalGraph";
import { ReviewSummary } from "./ReviewSummary";
import { SelectedMoveNote } from "./SelectedMoveNote";
import { ReviewPlayerRows } from "./ReviewPlayerRows";
import { VerdictLine } from "./VerdictLine";

const { root } = parsePgn("1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#");
const line = getGameLine(root);
const evals: PositionEval[] = [
  { type: "cp", value: 30, bestMove: "e2e4" },
  { type: "cp", value: 30, bestMove: "e7e5" },
  { type: "cp", value: 30, bestMove: "g1f3" },
  { type: "cp", value: 25, bestMove: "g8f6" },
  { type: "cp", value: 20, bestMove: "d2d3" },
  { type: "cp", value: 0, bestMove: "g7g6" },
  { type: "mate", value: 1, bestMove: "h5f7" },
  { type: "over", result: 1 },
];
const review = buildGameReview(toReviewMoves(root, line), evals);
const labels = ["Start", ...line.map((e) => moveLabel(e.node))];
const players = { white: "alice", black: "bob" };

type ButtonProps = { "aria-label": string; disabled: boolean; onClick: () => void };

/** Every <button> in an element tree (the rows component has no hooks, so it can be called directly) */
function buttonsIn(node: ReactNode): ReactElement<ButtonProps>[] {
  if (Array.isArray(node)) return node.flatMap(buttonsIn);
  if (!isValidElement<{ children?: ReactNode }>(node)) return [];
  const own = node.type === "button" ? [node as ReactElement<ButtonProps>] : [];
  return [...own, ...buttonsIn(node.props.children)];
}

describe("review components", () => {
  test("player rows: name, accuracy and the three counts per player", () => {
    const html = renderToStaticMarkup(
      <ReviewPlayerRows review={review} players={players} currentIndex={6} onJump={() => {}} />
    );
    expect(html).toContain('aria-label="Accuracy and errors per player"');
    expect(html.match(/<li/g)).toHaveLength(2);
    expect(html).toContain("alice");
    expect(html).toContain("bob");
    expect(html).toMatch(/accuracy <\/span>\d+\.\d%/);
    // Black's 3... Nf6 is a blunder: its chip is named and marked current
    expect(html).toContain('aria-label="bob: 1 blunder. Go to the blunder"');
    expect(html).toMatch(/aria-label="bob: 1 blunder[^"]*"[^>]*data-current="true"/);
    // Counts that are zero are disabled buttons
    expect(html).toMatch(/disabled=""[^>]*aria-label="alice: no blunders"/);
  });

  test("player rows without a review: names and a dash, no chips", () => {
    const html = renderToStaticMarkup(
      <ReviewPlayerRows review={null} players={players} currentIndex={0} onJump={() => {}} />
    );
    expect(html).toContain("alice");
    expect(html).toContain("–");
    expect(html).not.toContain("<button");
  });

  test("chips go to that player's next move of that kind, wrapping around", () => {
    const onJump = vi.fn();
    const chips = (currentIndex: number) =>
      buttonsIn(ReviewPlayerRows({ review, players, currentIndex, onJump }));
    const bobBlunder = (currentIndex: number) =>
      chips(currentIndex).find((b) => b.props["aria-label"].startsWith("bob: 1 blunder"))!;

    // From the start: the blunder is position 6 (after 3... Nf6)
    bobBlunder(0).props.onClick();
    expect(onJump).toHaveBeenLastCalledWith(6);
    // From after it: wraps back to it
    bobBlunder(7).props.onClick();
    expect(onJump).toHaveBeenLastCalledWith(6);
    // Each player has inaccuracy, mistake and blunder chips; empty ones are disabled
    expect(chips(0)).toHaveLength(6);
    expect(chips(0).filter((b) => b.props.disabled).map((b) => b.props["aria-label"])).toContain(
      "alice: no blunders"
    );
  });

  test("verdict: one line with the classification, the better move and winning chances", () => {
    const html = renderToStaticMarkup(<VerdictLine move={review.moves[5]} label={labels[6]} currentIndex={6} />);
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("3... Nf6");
    expect(html).toContain("Blunder.");
    expect(html).toContain('Best was <span class="font-medium text-foreground">g6</span>');
    expect(html).toContain("Black&#x27;s winning chances");
    expect(renderToStaticMarkup(<VerdictLine move={undefined} label={undefined} currentIndex={-1} />)).toContain(
      "variation"
    );
  });

  test("compact graph drops the readout row and keeps the slider", () => {
    const html = renderToStaticMarkup(
      <EvalGraph compact evals={review.evals} moves={review.moves} labels={labels} currentIndex={6} onSelect={() => {}} />
    );
    expect(html).toContain('role="slider"');
    expect(html).toContain("h-16");
    expect(html).not.toContain("h-30");
  });

  test("summary shows both players' accuracy and counts", () => {
    const html = renderToStaticMarkup(<ReviewSummary review={review} players={{ white: "alice", black: "bob" }} />);
    expect(html).toContain("alice");
    expect(html).toContain("bob");
    expect(html).toContain("Blunders");
    expect(html).toMatch(/\d+\.\d%/);
  });

  test("graph is a labelled slider with a marker for the blunder", () => {
    const html = renderToStaticMarkup(
      <EvalGraph evals={review.evals} moves={review.moves} labels={labels} currentIndex={6} onSelect={() => {}} />
    );
    expect(html).toContain('role="slider"');
    expect(html).toContain('aria-valuemax="7"');
    expect(html).toContain("3... Nf6, M1, blunder");
    expect(html).toContain("bg-red-500");
  });

  test("note names the better move", () => {
    const html = renderToStaticMarkup(<SelectedMoveNote move={review.moves[5]} label={labels[6]} currentIndex={6} />);
    expect(html).toContain("a blunder");
    expect(html).toContain("Best was <span class=\"font-medium\">g6</span>");
    const variation = renderToStaticMarkup(<SelectedMoveNote move={undefined} label={undefined} currentIndex={-1} />);
    expect(variation).toContain("variation");
  });
});
