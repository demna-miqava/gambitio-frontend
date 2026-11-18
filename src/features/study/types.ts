import type { ChatMessage } from "@/features/game-chat/types";

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

/** A room watching a game (Watch together): the game's moves in the tree */
export interface StudyGameLine {
  /** Ids of the nodes of the game's moves, in order; the last is the latest move ("Live") */
  line: string[];
  /** The game has ended: the room is an ordinary study room from now on */
  over: boolean;
}

export interface StudyState {
  nodes: Record<string, StudyNode>;
  /** The node everyone is looking at */
  cursor: string;
  nextId: number;
  /** Only in a room watching a game */
  game?: StudyGameLine;
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
  /** The live game the room watches (Watch together), null for an ordinary room */
  gameId?: number | null;
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

/**
 * Room chat, only in a room watching a game, and never for the game's own
 * players (even once they are invited after it) or a member whose game chat
 * setting is "nobody". Kept apart from the snapshot (see applyStudyChat), so
 * a message re-renders the chat, not the board.
 */
export interface StudyChatState {
  /** False once the chat has closed (a while after the game ended) */
  enabled: boolean;
  /**
   * Why it isn't enabled: "closed" after the game, or "off_by_you" when this
   * member's game chat setting is "nobody" (they then get no chat panel at
   * all: see applyStudyChat). Null while it is open.
   */
  reason?: "off_by_you" | "closed" | null;
  messages: ChatMessage[];
}

/** Messages the room socket sends. */
export type StudyServerMessage =
  | ({ type: "study_state"; chat?: StudyChatState } & StudyRoomSnapshot)
  | { type: "node_added"; node: StudyNode; cursor: string; version: number; by: number }
  | { type: "node_deleted"; nodeId: string; parentId: string; cursor: string; version: number; by: number }
  | { type: "children"; parentId: string; children: string[]; version: number; by: number }
  | { type: "cursor"; cursor: string; version: number; by: number }
  | { type: "node"; node: StudyNode; version: number; by: number }
  /** The watched game's line changed: new and reordered nodes, the line, and the cursor */
  | { type: "game_line"; nodes: StudyNode[]; game: StudyGameLine; cursor: string; version: number; by: number }
  | { type: "chat"; data: ChatMessage }
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
  | { type: "sync" }
  /** A room watching a game: bring its main line up to the game's moves */
  | { type: "sync_game" }
  | { type: "chat"; text: string };
