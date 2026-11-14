import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { SeriesSummary } from "@/features/series/types";
import type { RematchState } from "../hooks/useRematch";
import PostGameActions from "./PostGameActions";

const rematch = (over: Partial<RematchState> = {}) =>
  ({
    rematchOffered: false,
    rematchRequested: false,
    rematchDeclined: false,
    requestRematch: () => {},
    acceptRematch: () => {},
    declineRematch: () => {},
    cancelRematch: () => {},
    ...over,
  }) as RematchState;

const search = { isSearching: false, isConnecting: false, setShouldConnect: () => {} };

const series: SeriesSummary = {
  id: 7,
  createdAt: "2026-01-01T00:00:00Z",
  bestOf: 3,
  time: 5,
  increment: 0,
  status: "active",
  endReason: null,
  endedAt: null,
  winnerId: null,
  gamesPlayed: 1,
  playerOne: { id: 1, username: "alice", avatarUrl: null, score: 1 },
  playerTwo: { id: 2, username: "bob", avatarUrl: null, score: 0 },
  next: { number: 2, whiteId: 2, blackId: 1 },
};

const render = (props: Partial<Parameters<typeof PostGameActions>[0]>) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <PostGameActions rematch={rematch()} search={search} gameId={10} viewerId={1} {...props} />
    </MemoryRouter>
  );

describe("PostGameActions", () => {
  it("offers the next series game", () => {
    const html = render({ series });
    expect(html).toContain("Next game (2 of 3)");
    expect(html).toContain("You play black in game 2");
  });

  it("links to the game the rematch already started instead of offering it again", () => {
    const html = render({ series, rematchGameId: 11, rematch: rematch({ rematchRequested: true }) });
    expect(html).toContain('href="/game/11"');
    expect(html).toContain("Go to next game");
    expect(html).not.toContain("Next game (2 of 3)");
    expect(html).not.toContain("You play black");
  });
});
