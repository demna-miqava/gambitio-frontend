import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DuelGame } from "../hooks/useDuelGame";
import type { DuelInvite, DuelPlayer, DuelState, FinishedPuzzle } from "../types";
import { PuzzleDuelSidebar } from "./PuzzleDuelSidebar";

// The viewer is player 1; the invites are whatever a test puts here
const invites = vi.hoisted(() => ({
  incoming: [] as DuelInvite[],
  outgoing: [] as DuelInvite[],
  acceptPending: false,
  sendPending: false,
}));
vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ id: 1 }) }));
vi.mock("../hooks/useDuelInvites", () => ({
  useDuelInvites: () => ({
    incoming: invites.incoming,
    outgoing: invites.outgoing,
    accept: { isPending: invites.acceptPending, mutate: () => {} },
    send: { isPending: invites.sendPending, mutate: () => {} },
    cancel: { mutate: () => {} },
  }),
}));

const NOW = 1_800_000_000_000;
const me: DuelPlayer = {
  userId: 1,
  username: "queenside",
  avatarUrl: null,
  score: 2,
  strikes: 1,
  out: false,
  results: [
    { index: 0, solved: true },
    { index: 1, solved: false },
    { index: 2, solved: true },
  ],
};
const them: DuelPlayer = { userId: 2, username: "rook_lift", avatarUrl: null, score: 1, strikes: 0, out: false };
const state = (over: Partial<DuelState> = {}): DuelState => ({
  id: 12,
  status: "active",
  serverNow: NOW,
  startsAt: NOW - 30_000,
  endsAt: NOW + 95_000,
  endedAt: null,
  endReason: null,
  winnerId: null,
  rematchOf: null,
  maxStrikes: 3,
  players: [me, them],
  puzzle: null,
  finishedPuzzles: [],
  ...over,
});
const game = (over: Partial<DuelGame> = {}): DuelGame =>
  ({
    state: state(),
    isLoading: false,
    isError: false,
    retry: () => {},
    phase: "playing",
    serverNow: NOW,
    puzzle: null,
    color: "white",
    me,
    opponent: them,
    finishedPuzzles: [],
    flash: null,
    boardRef: { current: null },
    pendingPromotion: null,
    selectPromotion: () => {},
    cancelPromotion: () => {},
    ...over,
  }) as DuelGame;
const render = (over: Partial<DuelGame> = {}) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <PuzzleDuelSidebar game={game(over)} />
    </MemoryRouter>
  );
/** The duel finished, as the viewer's page has it */
const over = (stateOver: Partial<DuelState>, gameOver: Partial<DuelGame> = {}) =>
  render({
    phase: "over",
    state: state({ status: "finished", endedAt: NOW, endReason: "time", winnerId: 1, ...stateOver }),
    ...gameOver,
  });
const rematch = (direction: "theirs" | "mine", rematchOf = 12): DuelInvite => ({
  id: 50,
  createdAt: "",
  expiresAt: "",
  from: direction === "theirs" ? { id: 2, username: "rook_lift", avatarUrl: null } : { id: 1, username: "queenside", avatarUrl: null },
  to: direction === "theirs" ? { id: 1, username: "queenside", avatarUrl: null } : { id: 2, username: "rook_lift", avatarUrl: null },
  rematchOf,
});

beforeEach(() => {
  invites.incoming = [];
  invites.outgoing = [];
  invites.acceptPending = false;
  invites.sendPending = false;
});

describe("the duel panel before the state is in", () => {
  it("shows a placeholder while loading", () => {
    const html = render({ isLoading: true, state: undefined, phase: "loading" });
    expect(html).not.toContain("Time left");
    expect(html).not.toContain("Couldn't load");
  });

  it("offers to try again, or go back, when the duel can't be loaded", () => {
    const html = render({ isError: true, state: undefined, phase: "loading" });
    expect(html).toContain("Couldn&#x27;t load this duel.");
    expect(html).toContain("Try again");
    expect(html).toContain('href="/puzzles/duel"');
  });
});

describe("the duel panel while the duel is on", () => {
  it("shows the time left and what to do", () => {
    const html = render();
    // 95 seconds left
    expect(html).toMatch(/role="timer"[^>]*>1:35</);
    expect(html).toContain("Find the best move for white.");
    expect(html).toContain("3 strikes and you&#x27;re out");
    expect(html).toContain("rook_lift&#x27;s score");
  });

  it("names the side to move in the puzzle", () => {
    expect(render({ color: "black" })).toContain("Find the best move for black.");
  });

  it("shows the whole duel's length during the countdown, not a clock that is already running", () => {
    const html = render({
      phase: "countdown",
      state: state({ startsAt: NOW + 4_000, endsAt: NOW + 184_000 }),
    });
    expect(html).toMatch(/role="timer"[^>]*>3:00</);
    expect(html).toContain("Get ready: the first puzzle is coming.");
  });

  it("says a move was right, or a strike", () => {
    expect(render({ flash: { kind: "solved", square: "f3" } })).toContain("Right!");
    expect(render({ flash: { kind: "missed", square: "a3" } })).toContain("Missed. That&#x27;s a strike.");
  });

  it("tells a player who is out their score, and whether the other is still going", () => {
    const html = render({ phase: "out", me: { ...me, strikes: 3, out: true } });
    expect(html).toContain("You&#x27;re out with 2. rook_lift is still going.");
    const both = render({ phase: "out", me: { ...me, strikes: 3, out: true }, opponent: { ...them, out: true } });
    expect(both).toContain("You&#x27;re out with 2.");
    expect(both).not.toContain("still going");
  });

  it("says the scores are being counted once the clock has run out", () => {
    const html = render({ phase: "waiting", serverNow: NOW + 96_000 });
    expect(html).toContain("Time&#x27;s up. Counting the scores…");
    expect(html).toMatch(/role="timer"[^>]*>0:00</);
  });

  it("doesn't link to the finished puzzles before the duel is over", () => {
    const html = render({ finishedPuzzles: [{ index: 0 } as FinishedPuzzle] });
    expect(html).toContain("can be opened once the duel is over");
    expect(html).not.toContain('href="/analysis');
  });
});

describe("the result", () => {
  it("says who won, with both scores, the viewer's first", () => {
    const html = over({ winnerId: 1 });
    expect(html).toContain("You won the duel");
    expect(html).toContain("2 – 1");
    expect(html).toContain("The clock ran out.");
    expect(html).not.toContain("Time left");
  });

  it("says so when the viewer lost, or it was a draw", () => {
    expect(over({ winnerId: 2 })).toContain("You lost the duel");
    expect(over({ winnerId: null })).toContain("A draw");
  });

  it("says when it ended because both players struck out", () => {
    expect(over({ endReason: "both_out" })).toContain("Both players struck out.");
  });

  it("lists each player's puzzles, right or wrong, with a link to each one's position", () => {
    const fen = "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1";
    const html = over(
      {},
      {
        opponent: { ...them, results: [{ index: 0, solved: true }] },
        finishedPuzzles: [{ index: 0, puzzleId: "p0", fen, solution: ["d1d8"], rating: 640, themes: [] }],
      }
    );
    expect(html).toContain("queenside: 2 right, 1 wrong");
    expect(html).toContain("rook_lift: 1 right, 0 wrong");
    expect(html).toContain('aria-label="Puzzle 1, right: look at it on the analysis board"');
    expect(html).toContain(`href="/analysis?fen=${encodeURIComponent(fen)}"`);
    // A puzzle whose position didn't come is named, without a link
    expect(html).toContain('aria-label="Puzzle 2, wrong"');
  });

  it("says when a player finished no puzzles", () => {
    expect(over({}, { opponent: { ...them, score: 0, results: [] } })).toContain("No puzzles finished.");
  });

  it("offers a rematch, and the way back to the lobby", () => {
    const html = over({});
    expect(html).toContain("Rematch");
    expect(html).not.toContain("Accept");
    expect(html).toContain('href="/puzzles/duel"');
    expect(html).toContain("Back to duels");
  });

  it("offers to accept when the other player asked for the rematch first", () => {
    invites.incoming = [rematch("theirs")];
    const html = over({});
    expect(html).toContain("Accept rook_lift&#x27;s rematch");
    expect(html).not.toContain("Waiting for");
  });

  it("shows the viewer's own rematch as waiting, with a way to take it back", () => {
    invites.outgoing = [rematch("mine")];
    const html = over({});
    expect(html).toContain("Waiting for rook_lift… Cancel");
  });

  it("ignores rematch invites of other duels", () => {
    invites.incoming = [rematch("theirs", 99)];
    invites.outgoing = [rematch("mine", 98)];
    const html = over({});
    expect(html).not.toContain("Accept");
    expect(html).not.toContain("Waiting for");
  });
});
