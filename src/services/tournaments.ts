import { apiRequest } from ".";
import type {
  CreateTournamentBody,
  Paginated,
  Standing,
  TournamentListItem,
  TournamentState,
} from "@/features/tournaments/types";

/** "open": running and coming up; "finished": the latest first. */
export const getTournaments = (status: "open" | "finished", page = 1, limit = 20) =>
  apiRequest<Paginated<TournamentListItem>>("get", `/tournaments?status=${status}&page=${page}&limit=${limit}`);

/** Creates a tournament; the creator is its first player. */
export const createTournament = (body: CreateTournamentBody) =>
  apiRequest<TournamentState>("post", "/tournaments", { data: body });

/** The lobby (the socket sends the same on connect). */
export const getTournament = (tournamentId: number) =>
  apiRequest<TournamentState>("get", `/tournaments/${tournamentId}`);

/** The viewer's own line and game in progress, without the rest of the lobby. */
export const getTournamentMine = (tournamentId: number) =>
  apiRequest<Pick<TournamentState, "me" | "myGameId">>("get", `/tournaments/${tournamentId}/me`);

export const getTournamentStandings = (tournamentId: number, page: number, limit: number) =>
  apiRequest<Paginated<Standing>>("get", `/tournaments/${tournamentId}/standings?page=${page}&limit=${limit}`);

/** Join, or come back after a pause or after leaving. */
export const joinTournament = (tournamentId: number) =>
  apiRequest<{ me: Standing | null }>("post", `/tournaments/${tournamentId}/join`);

/** Stop being paired, keeping the place in the standings. */
export const pauseTournament = (tournamentId: number) =>
  apiRequest<{ me: Standing | null }>("post", `/tournaments/${tournamentId}/pause`);

export const withdrawFromTournament = (tournamentId: number) =>
  apiRequest<void>("post", `/tournaments/${tournamentId}/withdraw`);

/** Calls it off: its creator, before it starts. */
export const cancelTournament = (tournamentId: number) =>
  apiRequest<void>("delete", `/tournaments/${tournamentId}`);
