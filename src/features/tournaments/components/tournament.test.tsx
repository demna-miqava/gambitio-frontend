import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { Standing, Tournament, TournamentState } from "../types";
import { StandingsTable } from "./StandingsTable";
import { TournamentStatusCard, ordinal } from "./TournamentStatusCard";
import { TournamentPostGame, TournamentStrip } from "./TournamentGamePanel";
import MatchActions from "@/features/current-game/components/MatchActions";

// The viewer is player 2
vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ id: 2, image: "" }) }));
vi.mock("@/features/settings/SettingsContext", () => ({ useSettings: () => ({ settings: undefined }) }));

const NOW = Date.now();
const tournament: Tournament = {
  id: 3,
  name: "Friday Blitz",
  format: "arena",
  time: 180,
  increment: 0,
  type: "blitz",
  rated: true,
  startsAt: new Date(NOW - 10 * 60_000).toISOString(),
  endsAt: new Date(NOW + 35 * 60_000).toISOString(),
  status: "running",
  maxPlayers: 100,
  playerCount: 3,
  createdBy: { id: 1, username: "anna" },
  winner: null,
};
const line = (userId: number, over: Partial<Standing> = {}): Standing => ({
  rank: userId,
  userId,
  username: ["", "anna", "boris", "clara"][userId] ?? `player${userId}`,
  avatarUrl: null,
  rating: 1500 - userId * 10,
  provisional: false,
  score: 0,
  streak: 0,
  games: 0,
  wins: 0,
  draws: 0,
  performance: 0,
  sheet: "",
  status: "active",
  ...over,
});
const state = (over: Partial<TournamentState> = {}): TournamentState => ({
  tournament,
  standings: [
    line(1, { score: 8, streak: 3, games: 3, wins: 3, sheet: "224" }),
    line(2, { score: 2, games: 2, wins: 1, sheet: "02" }),
    line(3, { status: "paused", provisional: true }),
  ],
  standingsTotal: 3,
  liveGames: [],
  me: line(2, { score: 2, games: 2, wins: 1, sheet: "02" }),
  myGameId: null,
  ...over,
});

const render = (node: ReactNode) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient()}>{node}</QueryClientProvider>
    </MemoryRouter>
  );
const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ");

describe("StandingsTable", () => {
  it("lists the players with their points and score sheets, marking the viewer and a streak", () => {
    const s = state();
    const html = render(<StandingsTable tournamentId={3} top={s.standings} total={3} me={s.me} />);
    expect(text(html)).toMatch(/1 .*anna.* 8 /);
    expect(html).toContain('aria-label="Points per game: 2, 2, 4"');
    expect(html).toContain("On a streak: points count double");
    expect(html).toContain('href="/profile/1"');
    // The viewer's own row
    expect(html).toMatch(/boris<span class="sr-only"> \(you\)<\/span>/);
    // A paused player says so, and a provisional rating is marked
    expect(text(html)).toContain("? (provisional) · paused");
  });

  it("adds the viewer's line when it isn't among the ones shown", () => {
    const top = [line(1, { score: 9 })];
    const me = line(2, { rank: 27, score: 1 });
    const html = render(<StandingsTable tournamentId={3} top={top} total={40} me={me} />);
    expect(text(html)).toMatch(/27 .*boris/);
    // 40 lines: two pages
    expect(html).toContain('aria-label="Page 2"');
  });

  it("says so when nobody is in", () => {
    expect(render(<StandingsTable tournamentId={3} top={[]} total={0} me={null} />)).toContain("Nobody has joined yet.");
  });
});

describe("TournamentStatusCard", () => {
  const card = (s: TournamentState, connected = true, viewerId = 2) =>
    text(render(<TournamentStatusCard state={s} viewerId={viewerId} isConnected={connected} />));

  it("offers to join to someone who isn't in", () => {
    const out = card(state({ me: null }));
    expect(out).toContain("Join tournament");
    expect(out).toContain("you can join at any time");
    expect(card(state({ me: null, tournament: { ...tournament, playerCount: 100 } }))).toContain("This tournament is full.");
  });

  it("tells a waiting player they are being paired, and where they stand", () => {
    const out = card(state());
    expect(out).toContain("Finding you an opponent…");
    expect(out).toContain("You are 2nd with 2 points.");
    expect(out).toContain("Pause");
    expect(out).toContain("Leave tournament");
    expect(card(state(), false)).toContain("Reconnecting…");
  });

  it("doesn't promise an opponent in the last minute, when no games start", () => {
    const ending = { ...tournament, endsAt: new Date(NOW + 30_000).toISOString() };
    const out = card(state({ tournament: ending }));
    expect(out).toContain("No new games start this close to the end.");
    expect(out).not.toContain("Finding you an opponent");
  });

  it("sends a player with a game on to it", () => {
    const html = render(<TournamentStatusCard state={state({ myGameId: 41 })} viewerId={2} isConnected />);
    expect(html).toContain('href="/game/41"');
    expect(text(html)).not.toContain("Finding you an opponent");
  });

  it("lets a paused player, or one who left, come back", () => {
    expect(card(state({ me: line(2, { status: "paused" }) }))).toMatch(/Paused .*Resume/);
    expect(card(state({ me: line(2, { status: "withdrawn", games: 1 }) }))).toMatch(/You left this tournament .*Rejoin/);
  });

  it("before the start: you're in, and only the creator can call it off", () => {
    const scheduled = { ...tournament, status: "scheduled" as const, startsAt: new Date(NOW + 60_000).toISOString() };
    const mine = card(state({ tournament: scheduled, me: line(2) }));
    expect(mine).toContain("You're in");
    expect(mine).not.toContain("Cancel tournament");
    expect(card(state({ tournament: scheduled, me: line(1) }), true, 1)).toContain("Cancel tournament");
  });

  it("after the end: how it went", () => {
    const finished = { ...tournament, status: "finished" as const, winner: { id: 1, username: "anna" } };
    expect(card(state({ tournament: finished }))).toContain("You finished 2nd 2 points from 2 games.");
    expect(card(state({ tournament: finished, me: line(1, { rank: 1, games: 3, score: 8 }) }), true, 1)).toContain("You won");
    expect(card(state({ tournament: finished, me: null }))).toContain("Won by anna.");
    expect(card(state({ tournament: { ...tournament, status: "cancelled" }, me: null }))).toContain("Cancelled");
  });

  it("writes places as ordinals", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 103, 111].map(ordinal)).toEqual([
      "1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "103rd", "111th",
    ]);
  });
});

describe("a tournament game's page", () => {
  it("names the tournament and the player's place above the moves", () => {
    const html = render(<TournamentStrip tournamentId={3} state={state()} />);
    expect(html).toContain('href="/tournaments/3"');
    expect(text(html)).toContain("Friday Blitz 2nd · 2 pts");
    expect(text(render(<TournamentStrip tournamentId={3} state={undefined} />))).toContain("Tournament");
  });

  it("after the game: the next one is on its way, with no rematch", () => {
    const html = render(<TournamentPostGame tournamentId={3} gameId={41} state={state()} isConnected />);
    const out = text(html);
    expect(out).toContain("Pairing your next game…");
    expect(out).toContain("You are 2nd with 2 points.");
    expect(out).not.toContain("Rematch");
    expect(out).not.toContain("New game");
    expect(html).toContain('href="/tournaments/3"');
    expect(html).toContain('href="/archive/41?review=1"');
  });

  it("after the game: paused players can resume, and a closed tournament says so", () => {
    const paused = text(render(<TournamentPostGame tournamentId={3} gameId={41} state={state({ me: line(2, { status: "paused", games: 1 }) })} isConnected />));
    expect(paused).toMatch(/You're paused .*Resume/);
    const over = { ...tournament, status: "finished" as const };
    expect(text(render(<TournamentPostGame tournamentId={3} gameId={41} state={state({ tournament: over })} isConnected />))).toContain("The tournament is over.");
    const ending = { ...tournament, endsAt: new Date(NOW + 30_000).toISOString() };
    const nearly = text(render(<TournamentPostGame tournamentId={3} gameId={41} state={state({ tournament: ending })} isConnected />));
    expect(nearly).toContain("no new games start this close to the end");
    expect(nearly).not.toContain("Pairing your next game");
    const late = { ...tournament, endsAt: new Date(NOW - 1_000).toISOString() };
    expect(text(render(<TournamentPostGame tournamentId={3} gameId={41} state={state({ tournament: late })} isConnected />))).toContain("Time is up");
  });

  it("has Resign and Offer draw from the first move, and neither Abort nor Takeback", () => {
    const actions = (tournamentGame: boolean, hasMoves: boolean) =>
      text(
        render(
          <MatchActions
            hasMoves={hasMoves}
            onAbort={() => {}}
            onResign={() => {}}
            onOfferDraw={() => {}}
            drawOfferSent={false}
            canOfferDraw
            onRequestTakeback={() => {}}
            takebackRequested={false}
            canRequestTakeback
            disabled={false}
            tournament={tournamentGame}
          />
        )
      );
    expect(actions(true, false)).toContain("Resign");
    expect(actions(true, false)).not.toContain("Abort");
    expect(actions(true, true)).not.toContain("Takeback");
    // An ordinary game is as it was
    expect(actions(false, false)).toContain("Abort");
    expect(actions(false, true)).toContain("Takeback");
  });
});
