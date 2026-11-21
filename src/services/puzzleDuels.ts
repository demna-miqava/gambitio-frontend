import { apiRequest } from ".";
import type { DuelInvite, DuelMoveResult, DuelState } from "@/features/puzzles/duel/types";

export const sendDuelInvite = async (recipientId: number, rematchOf?: number) =>
  (
    await apiRequest<{ data: DuelInvite }>("post", "/puzzle-duels/invites", {
      data: { recipientId, ...(rematchOf !== undefined && { rematchOf }) },
    })
  ).data;

export const getDuelInvites = async () =>
  (await apiRequest<{ data: { incoming: DuelInvite[]; outgoing: DuelInvite[] } }>("get", "/puzzle-duels/invites"))
    .data;

export const acceptDuelInvite = async (inviteId: number) =>
  (await apiRequest<{ data: { duelId: number } }>("post", `/puzzle-duels/invites/${inviteId}/accept`)).data;

export const declineDuelInvite = (inviteId: number) =>
  apiRequest<void>("post", `/puzzle-duels/invites/${inviteId}/decline`);

export const cancelDuelInvite = (inviteId: number) =>
  apiRequest<void>("post", `/puzzle-duels/invites/${inviteId}/cancel`);

export const getActiveDuel = async () =>
  (await apiRequest<{ data: { duelId: number | null } }>("get", "/puzzle-duels/active")).data.duelId;

export const getDuel = async (duelId: number) =>
  (await apiRequest<{ data: DuelState }>("get", `/puzzle-duels/${duelId}`)).data;

export const sendDuelMove = async (duelId: number, index: number, move: string) =>
  (await apiRequest<{ data: DuelMoveResult }>("post", `/puzzle-duels/${duelId}/moves`, { data: { index, move } }))
    .data;
