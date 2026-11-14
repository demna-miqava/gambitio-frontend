/**
 * Study rooms, as the server sends them (backend src/game/studyState.ts and
 * src/services/studyService.ts).
 */

export const STUDY_BRUSHES = ["green", "red", "blue", "yellow"] as const;
export type StudyBrush = (typeof STUDY_BRUSHES)[number];

/** An arrow (orig → dest) or a circled square (no dest). */
export interface StudyShape {
  orig: string;
  dest?: string;
  brush: StudyBrush;
}

export interface StudyNode {
  id: string;
  parentId: string | null;
  /** The move that led here; null for the root */
  san: string | null;
  uci: string | null;
  fen: string;
  /** Half-moves before this position, counted from move 1 */
  ply: number;
  /** children[0] is the main continuation, later ones are variations */
  children: string[];
  comment: string;
  shapes: StudyShape[];
}

export interface StudyState {
  nodes: Record<string, StudyNode>;
  /** The node everyone is looking at */
  cursor: string;
  nextId: number;
}

export const STUDY_ROOT_ID = "root";
export const MAX_COMMENT_LENGTH = 1_000;

export interface StudyMember {
  id: number;
  username: string;
  avatarUrl: string | null;
}

export interface StudyRoomMeta {
  id: number;
  name: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface StudyRoomListItem extends Omit<StudyRoomMeta, "version"> {
  ownerUsername: string;
  memberCount: number;
  moveCount: number;
}

/** Everything the room page shows. */
export interface StudyRoomSnapshot {
  room: StudyRoomMeta;
  state: StudyState;
  members: StudyMember[];
  /** Users with the room open */
  present: number[];
}

/** Messages the room socket sends. */
export type StudyServerMessage =
  | ({ type: "study_state" } & StudyRoomSnapshot)
  | { type: "node_added"; node: StudyNode; cursor: string; version: number; by: number }
  | { type: "node_deleted"; nodeId: string; parentId: string; cursor: string; version: number; by: number }
  | { type: "children"; parentId: string; children: string[]; version: number; by: number }
  | { type: "cursor"; cursor: string; version: number; by: number }
  | { type: "node"; node: StudyNode; version: number; by: number }
  | { type: "presence"; userIds: number[] }
  | { type: "members"; members: StudyMember[] }
  | { type: "room_renamed"; name: string }
  | { type: "removed" }
  | { type: "room_deleted" }
  | { type: "error"; data: { message: string; code?: string } };

/** Messages the room socket accepts. */
export type StudyClientMessage =
  | { type: "move"; nodeId: string; uci: string }
  | { type: "goto"; nodeId: string }
  | { type: "comment"; nodeId: string; text: string }
  | { type: "shapes"; nodeId: string; shapes: StudyShape[] }
  | { type: "delete"; nodeId: string }
  | { type: "promote"; nodeId: string }
  | { type: "sync" };
