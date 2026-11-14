import { apiRequest } from ".";
import type {
  StudyMember,
  StudyRoomListItem,
  StudyRoomMeta,
  StudyRoomSnapshot,
} from "@/features/study/types";

export interface CreateStudyRoomBody {
  name: string;
  /** Starting position; the standard one when left out */
  fen?: string;
  /** Moves in SAN from that position, e.g. a game to review */
  moves?: string[];
}

/** Rooms the signed-in player is in, recently changed first. */
export const getStudyRooms = async (): Promise<StudyRoomListItem[]> =>
  (await apiRequest<{ rooms: StudyRoomListItem[] }>("get", "/study")).rooms;

export const createStudyRoom = async (body: CreateStudyRoomBody): Promise<StudyRoomMeta> =>
  (await apiRequest<{ room: StudyRoomMeta }>("post", "/study", { data: body })).room;

/** Room, analysis and members (the socket sends the same on connect). */
export const getStudyRoom = (roomId: number) =>
  apiRequest<Omit<StudyRoomSnapshot, "present">>("get", `/study/${roomId}`);

export const renameStudyRoom = async (roomId: number, name: string): Promise<StudyRoomMeta> =>
  (await apiRequest<{ room: StudyRoomMeta }>("patch", `/study/${roomId}`, { data: { name } })).room;

export const deleteStudyRoom = (roomId: number) => apiRequest<void>("delete", `/study/${roomId}`);

/** Invites a friend (any member may). */
export const inviteToStudyRoom = async (roomId: number, userId: number): Promise<StudyMember[]> =>
  (await apiRequest<{ members: StudyMember[] }>("post", `/study/${roomId}/members`, { data: { userId } }))
    .members;

/** Leave a room, or (owner) remove someone from it. */
export const removeStudyMember = (roomId: number, userId: number) =>
  apiRequest<void>("delete", `/study/${roomId}/members/${userId}`);
