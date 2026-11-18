import { describe, expect, it } from "vitest";
import type { Standing, Tournament, TournamentState } from "../types";
import {
  applyTournamentMessage,
  formatCountdown,
  formatLength,
  isOpen,
  lengthMinutes,
  sheetDigits,
  stillPairing,
  tournamentFacts,
  tournamentPhase,
} from "./tournamentFormat";

const START = Date.parse("2026-11-20T18:00:00Z");
const tournament: Tournament = {
  id: 3,
  name: "Friday Blitz",
  format: "arena",
  time: 180,
  increment: 2,
  type: "blitz",
  rated: true,
  startsAt: new Date(START).toISOString(),
  endsAt: new Date(START + 45 * 60_000).toISOString(),
  status: "scheduled",
  maxPlayers: 100,
  playerCount: 4,
  createdBy: { id: 1, username: "anna" },
  winner: null,
};
const line = (userId: number, score: number, rank: number): Standing => ({
  rank,
  userId,
  username: `player${userId}`,
  avatarUrl: null,
  rating: 1500,
  provisional: false,
  score,
  streak: 0,
  games: 1,
  wins: 0,
  draws: 0,
  performance: 1500,
  sheet: String(score),
  status: "active",
});
const state: TournamentState = {
  tournament: { ...tournament, status: "running" },
  standings: [line(1, 2, 1), line(2, 0, 2)],
  standingsTotal: 2,
  liveGames: [{ id: 9, white: { id: 1, username: "player1" }, black: { id: 2, username: "player2" } }],
  me: line(2, 0, 2),
  myGameId: 9,
};

describe("labels", () => {
  it("describes a tournament in a line", () => {
    expect(tournamentFacts(tournament)).toBe("Blitz 3+2 · Rated · 45 min");
    expect(tournamentFacts({ ...tournament, rated: false, type: "rapid", time: 600, increment: 0 })).toBe(
      "Rapid 10+0 · Unrated · 45 min"
    );
    expect(lengthMinutes(tournament)).toBe(45);
    expect([formatLength(20), formatLength(60), formatLength(90)]).toEqual(["20 min", "1 h", "1 h 30 min"]);
  });

  it("counts down in minutes and seconds, with hours when there are any", () => {
    expect(formatCountdown(245_000)).toBe("4:05");
    expect(formatCountdown(999)).toBe("0:01");
    expect(formatCountdown(3_723_000)).toBe("1:02:03");
    expect(formatCountdown(0)).toBe("0:00");
    expect(formatCountdown(-5_000)).toBe("0:00");
  });

  it("marks the doubled wins of a streak on the score sheet", () => {
    expect(sheetDigits("2241")).toEqual([
      { points: "2", onStreak: false },
      { points: "2", onStreak: false },
      { points: "4", onStreak: true },
      { points: "1", onStreak: false },
    ]);
    expect(sheetDigits("")).toEqual([]);
  });
});

describe("tournamentPhase", () => {
  it("follows the tournament from before its start to after its end", () => {
    expect(tournamentPhase(tournament, START - 90_000)).toEqual({ kind: "upcoming", msLeft: 90_000 });
    // Its time has come but it hasn't started: waiting for a second player
    expect(tournamentPhase(tournament, START + 1_000)).toEqual({ kind: "starting" });
    const running = { ...tournament, status: "running" as const };
    expect(tournamentPhase(running, START + 60_000)).toEqual({ kind: "running", msLeft: 44 * 60_000 });
    // Time is up, the last games are still being played
    expect(tournamentPhase(running, START + 46 * 60_000)).toEqual({ kind: "closing" });
    expect(tournamentPhase({ ...tournament, status: "finished" }, START)).toEqual({ kind: "finished" });
    expect(tournamentPhase({ ...tournament, status: "cancelled" }, START)).toEqual({ kind: "cancelled" });
    expect([isOpen(tournament), isOpen(running), isOpen({ status: "finished" })]).toEqual([true, true, false]);
  });
});

describe("stillPairing", () => {
  it("stops a clock's length before the end, a minute at most", () => {
    const running = { ...tournament, status: "running" as const };
    const END = START + 45 * 60_000;
    expect(stillPairing(running, END - 61_000)).toBe(true);
    expect(stillPairing(running, END - 60_000)).toBe(false);
    // A 30-second clock: games still start until 30 seconds before the end
    expect(stillPairing({ ...running, time: 30 }, END - 31_000)).toBe(true);
    expect(stillPairing({ ...running, time: 30 }, END - 30_000)).toBe(false);
    expect(stillPairing(running, END + 1_000)).toBe(false);
    // Nothing is paired before it starts or once it is over
    expect(stillPairing(tournament, START)).toBe(false);
    expect(stillPairing({ ...tournament, status: "finished" }, START)).toBe(false);
  });
});

describe("applyTournamentMessage", () => {
  it("takes the whole state as it comes", () => {
    expect(applyTournamentMessage(undefined, { type: "state", data: state })).toEqual({ state, stale: false });
  });

  it("ignores updates before the first state", () => {
    const update = { type: "tournament" as const, data: { tournament } };
    expect(applyTournamentMessage(undefined, update)).toEqual({ state: undefined, stale: false });
  });

  it("moves the viewer's own line with the standings", () => {
    const { state: next, stale } = applyTournamentMessage(state, {
      type: "standings",
      data: {
        standings: [line(2, 4, 1), line(1, 2, 2), line(3, 0, 3)],
        standingsTotal: 3,
        liveGames: [],
        playerCount: 5,
      },
    });
    expect(stale).toBe(false);
    expect(next?.me).toMatchObject({ userId: 2, score: 4, rank: 1 });
    expect(next?.standingsTotal).toBe(3);
    expect(next?.tournament.playerCount).toBe(5);
    // Their game was among the live ones and no longer is: it ended
    expect(next?.myGameId).toBeNull();
  });

  it("knows the viewer's game ended when they have played one more, though it wasn't among the live ones shown", () => {
    // Their game (9) isn't one of the few the lobby lists
    const playing = { ...state, liveGames: [] };
    const standings = (games: number) => ({
      type: "standings" as const,
      data: { standings: [line(1, 2, 1), { ...line(2, 0, 2), games }], standingsTotal: 2, liveGames: [], playerCount: 2 },
    });
    expect(applyTournamentMessage(playing, standings(1)).state?.myGameId).toBe(9);
    expect(applyTournamentMessage(playing, standings(2)).state?.myGameId).toBeNull();
  });

  it("finds the viewer's own game among the ones just started", () => {
    const waiting = { ...state, liveGames: [], myGameId: null };
    const pairings = {
      type: "pairings" as const,
      data: { games: [{ id: 14, whiteId: 5, blackId: 6 }, { id: 15, whiteId: 1, blackId: 2 }] },
    };
    const paired = applyTournamentMessage(waiting, pairings);
    expect(paired.pairedGameId).toBe(15);
    expect(paired.state?.myGameId).toBe(15);
    // Someone watching, or a player who got no game this time, stays where they are
    expect(applyTournamentMessage({ ...waiting, me: null }, pairings)).toEqual({
      state: { ...waiting, me: null },
      stale: false,
    });
    const others = { type: "pairings" as const, data: { games: [{ id: 14, whiteId: 5, blackId: 6 }] } };
    expect(applyTournamentMessage(waiting, others)).toEqual({ state: waiting, stale: false });
  });

  it("says what to do about the viewer's own line when they are below the lines it was sent", () => {
    const below = (changed?: number[]) =>
      applyTournamentMessage(state, {
        type: "standings",
        data: { standings: [line(1, 2, 1)], standingsTotal: 30, liveGames: state.liveGames, playerCount: 30, changed },
      });
    // Others scored: their place may have moved, which can wait a little
    const moved = below([1, 7]);
    expect([moved.stale, moved.ownLine]).toEqual([false, "moved"]);
    // Until it is fetched the old line stays, rather than vanishing
    expect(moved.state?.me).toEqual(state.me);
    expect(moved.state?.myGameId).toBe(9);
    // Their own game ended (or they were paused): theirs is asked for at once
    expect(below([1, 2]).ownLine).toBe("changed");
    // A server that doesn't say who changed
    expect(below().ownLine).toBe("moved");
  });

  it("asks for nothing for a spectator, or for a viewer whose line is in the message", () => {
    const watching = { ...state, me: null, myGameId: null };
    const seen = applyTournamentMessage(watching, {
      type: "standings",
      data: { standings: [line(1, 2, 1)], standingsTotal: 1, liveGames: [], playerCount: 1, changed: [1] },
    });
    expect([seen.stale, seen.ownLine]).toEqual([false, undefined]);
    const inIt = applyTournamentMessage(state, {
      type: "standings",
      data: { standings: [line(1, 2, 1), line(2, 2, 2)], standingsTotal: 2, liveGames: [], playerCount: 2, changed: [2] },
    });
    expect([inIt.stale, inIt.ownLine]).toEqual([false, undefined]);
  });

  it("asks for a fresh state when the tournament starts or ends", () => {
    const finished = { ...state.tournament, status: "finished" as const, winner: { id: 1, username: "player1" } };
    const ended = applyTournamentMessage(state, { type: "tournament", data: { tournament: finished } });
    expect(ended.stale).toBe(true);
    expect(ended.state?.tournament.winner?.username).toBe("player1");
    const same = applyTournamentMessage(state, { type: "tournament", data: { tournament: state.tournament } });
    expect(same.stale).toBe(false);
  });
});
