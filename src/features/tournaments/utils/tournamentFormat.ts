import { formatTimeControl } from "@/utils/timeControl";
import type { Standing, Tournament, TournamentServerMessage, TournamentState } from "../types";

/** Clocks the create form offers, as [seconds, increment]. */
export const CLOCK_PRESETS: readonly (readonly [number, number])[] = [
  [60, 0],
  [120, 1],
  [180, 0],
  [180, 2],
  [300, 0],
  [300, 3],
  [600, 0],
  [600, 5],
  [900, 10],
];
/** Lengths the create form offers, in minutes. */
export const LENGTH_PRESETS = [20, 30, 45, 60, 90, 120] as const;
/** "Starts in" choices of the create form, in minutes. */
export const START_PRESETS = [5, 10, 15, 30, 60] as const;

export const NAME_MIN = 3;
export const NAME_MAX = 60;

/** "1 h 30 min", "45 min" */
export const formatLength = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
};

/** How long a tournament runs, in minutes. */
export const lengthMinutes = (tournament: Pick<Tournament, "startsAt" | "endsAt">): number =>
  Math.round((new Date(tournament.endsAt).getTime() - new Date(tournament.startsAt).getTime()) / 60_000);

/** "Blitz 3+0 · Rated · 45 min" */
export const tournamentFacts = (
  tournament: Pick<Tournament, "type" | "time" | "increment" | "rated" | "startsAt" | "endsAt">
): string =>
  [
    `${tournament.type[0].toUpperCase()}${tournament.type.slice(1)} ${formatTimeControl(tournament.time, tournament.increment)}`,
    tournament.rated ? "Rated" : "Unrated",
    formatLength(lengthMinutes(tournament)),
  ].join(" · ");

/** A countdown: "4:05", "1:02:03"; "0:00" once the time has come. */
export const formatCountdown = (ms: number): string => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}` : `${minutes}:${seconds}`;
};

/**
 * Where a tournament is at `now`:
 * - "upcoming": not started, `msLeft` until it does
 * - "starting": its time has come and it is waiting for a second player
 * - "running": on, `msLeft` until the last games are started
 * - "closing": time is up, the last games are being played out
 * - "finished", "cancelled"
 */
export type TournamentPhase =
  | { kind: "upcoming" | "running"; msLeft: number }
  | { kind: "starting" | "closing" | "finished" | "cancelled" };

export function tournamentPhase(
  tournament: Pick<Tournament, "status" | "startsAt" | "endsAt">,
  now: number
): TournamentPhase {
  if (tournament.status === "finished" || tournament.status === "cancelled") return { kind: tournament.status };
  if (tournament.status === "scheduled") {
    const msLeft = new Date(tournament.startsAt).getTime() - now;
    return msLeft > 0 ? { kind: "upcoming", msLeft } : { kind: "starting" };
  }
  const msLeft = new Date(tournament.endsAt).getTime() - now;
  return msLeft > 0 ? { kind: "running", msLeft } : { kind: "closing" };
}

/**
 * How long before the end the last games are started: the tournament's
 * clock, a minute at most. The server's rule (lastPairingMs in its
 * src/game/arena.ts); keep the two the same.
 */
export const lastPairingMs = (timeSeconds: number): number => Math.min(60, timeSeconds) * 1000;

/**
 * Whether a running tournament still starts games at `now`. In its last
 * moments it doesn't, though its time isn't up: a player who is free then
 * isn't waiting for an opponent any more.
 */
export const stillPairing = (tournament: Pick<Tournament, "status" | "endsAt" | "time">, now: number): boolean =>
  tournament.status === "running" &&
  new Date(tournament.endsAt).getTime() - now > lastPairingMs(tournament.time);

/** Whether a tournament can still be joined (or left, or paused). */
export const isOpen = (tournament: Pick<Tournament, "status">): boolean =>
  tournament.status === "scheduled" || tournament.status === "running";

/**
 * The score sheet's digits, oldest first. A "4" can only be a win on a
 * streak, and is marked so the standings can show it.
 */
export const sheetDigits = (sheet: string): { points: string; onStreak: boolean }[] =>
  [...sheet].map((points) => ({ points, onStreak: points === "4" }));

/**
 * The lobby after a socket message. "standings" carries the top of the
 * table for everyone, so the viewer's own line is taken from it when it is
 * there. When it isn't (they are further down), `ownLine` says what to do
 * about theirs: "changed" when the message names them (their game ended,
 * they paused: ask for it now), "moved" when only their place may have
 * shifted because of others (asking now and then is enough). `stale` says
 * the tournament changed state and the whole lobby should be fetched again.
 * "pairings" lists the games just started: `pairedGameId` is the viewer's
 * own, when they are in one, for the page to open.
 */
export function applyTournamentMessage(
  state: TournamentState | undefined,
  message: TournamentServerMessage
): {
  state: TournamentState | undefined;
  stale: boolean;
  ownLine?: "changed" | "moved";
  pairedGameId?: number;
} {
  if (message.type === "state") return { state: message.data, stale: false };
  if (!state) return { state, stale: false };
  if (message.type === "pairings") {
    const viewerId = state.me?.userId;
    const mine =
      viewerId === undefined
        ? undefined
        : message.data.games.find((game) => game.whiteId === viewerId || game.blackId === viewerId);
    if (!mine) return { state, stale: false };
    return { state: { ...state, myGameId: mine.id }, stale: false, pairedGameId: mine.id };
  }
  if (message.type === "standings") {
    const { standings, standingsTotal, liveGames, playerCount, changed = [] } = message.data;
    const mine: Standing | undefined = state.me
      ? standings.find((line) => line.userId === state.me!.userId)
      : undefined;
    return {
      state: {
        ...state,
        tournament: { ...state.tournament, playerCount },
        standings,
        standingsTotal,
        liveGames,
        me: mine ?? state.me,
        // The viewer's game ended if they have played one more than before,
        // or if it is no longer among the live ones (the list is the top
        // few, so only a game seen there can be dropped that way)
        myGameId:
          state.myGameId !== null &&
          ((mine !== undefined && state.me !== null && mine.games > state.me.games) ||
            (state.liveGames.some((game) => game.id === state.myGameId) &&
              !liveGames.some((game) => game.id === state.myGameId)))
            ? null
            : state.myGameId,
      },
      stale: false,
      ...(state.me !== null &&
        mine === undefined && { ownLine: changed.includes(state.me.userId) ? ("changed" as const) : ("moved" as const) }),
    };
  }
  if (message.type === "tournament") {
    return {
      state: { ...state, tournament: message.data.tournament },
      stale: message.data.tournament.status !== state.tournament.status,
    };
  }
  return { state, stale: false };
}
