/** A player the signed-in user has blocked (GET /blocks). */
export interface BlockedUser {
  id: number;
  username: string;
  avatarUrl: string | null;
  blockedAt: string;
}

/** Same values as the server's REPORT_REASONS */
export type ReportReason =
  | "cheating"
  | "abusive_chat"
  | "unsporting"
  | "offensive_name"
  | "other";

export interface ReportInput {
  reportedId: number;
  reason: ReportReason;
  details?: string;
  /** The game it happened in; only a game the two played against each other */
  gameId?: number;
  /**
   * Instead of gameId: the study room it happened in (its chat goes with
   * the report); only a room both are members of
   */
  studyRoomId?: number;
}

export const REPORT_REASONS: { value: ReportReason; label: string; hint: string }[] = [
  { value: "cheating", label: "Cheating", hint: "Using an engine or someone else's help" },
  { value: "abusive_chat", label: "Abusive chat", hint: "Insults, harassment or spam" },
  { value: "unsporting", label: "Unsporting play", hint: "Stalling, or losing on purpose" },
  { value: "offensive_name", label: "Offensive name or picture", hint: "Their username or avatar" },
  { value: "other", label: "Something else", hint: "Tell us what happened below" },
];

/** Same as the server's REPORT_DETAILS_MAX_LENGTH */
export const REPORT_DETAILS_MAX_LENGTH = 1000;
