import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { DuelGame } from "../hooks/useDuelGame";
import type { DuelPlayer, DuelState } from "../types";
import { DuelBoard } from "./DuelBoard";

// The board frame as text: who is where, with what beside their name
vi.mock("@/features/game/components/BoardLayout", () => ({
  BoardLayout: (props: {
    boardLabel?: string;
    topPlayer?: { name: string };
    bottomPlayer?: { name: string };
    topPlayerClock?: ReactNode;
    bottomPlayerClock?: ReactNode;
    children?: ReactNode;
  }) => (
    <div data-label={props.boardLabel}>
      <p data-row="top">
        {props.topPlayer?.name}: {props.topPlayerClock}
      </p>
      <p data-row="bottom">
        {props.bottomPlayer?.name}: {props.bottomPlayerClock}
      </p>
      {props.children}
    </div>
  ),
}));
vi.mock("@/features/game/components/PromotionSelector", () => ({
  PromotionSelector: (props: { color: string; square: string; boardOrientation: string }) => (
    <p data-promotion={`${props.color} on ${props.square}, seen from ${props.boardOrientation}`} />
  ),
}));
vi.mock("@/components/PlayerAvatar", () => ({ PlayerAvatar: () => null }));

const NOW = 1_800_000_000_000;
const me: DuelPlayer = { userId: 1, username: "queenside", avatarUrl: null, score: 2, strikes: 1, out: false };
const them: DuelPlayer = { userId: 2, username: "rook_lift", avatarUrl: null, score: 4, strikes: 3, out: true };
const state = { maxStrikes: 3, startsAt: NOW - 30_000, endsAt: NOW + 150_000 } as DuelState;
const render = (over: Partial<DuelGame> = {}) =>
  renderToStaticMarkup(
    <DuelBoard
      game={
        {
          boardRef: { current: null },
          state,
          me,
          opponent: them,
          phase: "playing",
          serverNow: NOW,
          color: "white",
          pendingPromotion: null,
          selectPromotion: () => {},
          cancelPromotion: () => {},
          ...over,
        } as DuelGame
      }
    />
  );
const row = (html: string, which: "top" | "bottom") => html.match(new RegExp(`<p data-row="${which}">(.*?)</p>`))![1]!;

describe("the duel's board", () => {
  it("has the viewer below and the other player above, each with their score and strikes", () => {
    const html = render();
    expect(row(html, "bottom")).toContain("queenside");
    expect(row(html, "bottom")).toContain("2 solved, 1 of 3 strikes");
    expect(row(html, "top")).toContain("rook_lift");
    expect(row(html, "top")).toContain("4 solved, 3 of 3 strikes, out");
  });

  it("says what the board is for", () => {
    expect(render()).toContain('data-label="Puzzle board. Find the best move for white."');
    expect(render({ color: "black" })).toContain("Find the best move for black.");
    expect(render({ phase: "countdown", state: { ...state, startsAt: NOW + 3_000 } })).toContain(
      "Puzzle board. The duel is about to start."
    );
    expect(render({ phase: "over" })).toContain('data-label="Puzzle board."');
  });

  it("covers the board with the countdown until the start, in whole seconds", () => {
    const html = render({ phase: "countdown", state: { ...state, startsAt: NOW + 2_400 } });
    expect(html).toContain("Same puzzles for both. Get ready");
    expect(html).toMatch(/>3<\/span>/);
    expect(render()).not.toContain("Get ready");
  });

  it("asks which piece when a pawn reaches the last rank, from the solver's side", () => {
    const html = render({ color: "black", pendingPromotion: { from: "e2", to: "e1" } as DuelGame["pendingPromotion"] });
    expect(html).toContain('data-promotion="black on e1, seen from black"');
    expect(render()).not.toContain("data-promotion");
  });

  it("shows no player rows before the duel has loaded", () => {
    const html = render({ state: undefined, me: null, opponent: null, phase: "loading" });
    expect(html).not.toContain("solved");
  });
});
