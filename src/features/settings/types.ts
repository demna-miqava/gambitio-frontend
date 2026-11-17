import type { PaletteId } from "@/constants/palettes";

export type AllowedFrom = "everyone" | "only_friends" | "nobody";
export type MessagesAllowedFrom = AllowedFrom;

export type Settings = {
  userId: number;
  boardCoordinatesEnabled: boolean;
  moveHighlightEnabled: boolean;
  soundsEnabled: boolean;
  premovesEnabled: boolean;
  autoPromoteToQueenEnabled: boolean;
  confirmDrawResignationEnabled: boolean;
  showLegalMovesEnabled: boolean;
  engineEvaluationEnabled: boolean;
  showTimestampsEnabled: boolean;
  showRatingsDuringGameEnabled: boolean;
  pieceIconNotationEnabled: boolean;
  emailNotificationsEnabled: boolean;
  messagesAllowedFrom: MessagesAllowedFrom;
  /** Who the user chats with during games; both players must allow the other */
  gameChatAllowedFrom: AllowedFrom;
  /** Who may challenge the user to a game */
  challengesAllowedFrom: AllowedFrom;
  /** During a live game, show only the board, the clocks and the game actions */
  focusModeEnabled: boolean;
  colorPalette: PaletteId;
};
