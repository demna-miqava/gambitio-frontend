/**
 * Router state that opens the import page with a game already loaded: a
 * finished bot game that couldn't be saved on the server (saved ones open
 * in the archive instead).
 */
export interface ImportGameState {
  pgn: string;
  /** Start the computer review right away */
  review?: boolean;
}

export const readImportGameState = (state: unknown): ImportGameState | null => {
  if (!state || typeof state !== "object") return null;
  const { pgn, review } = state as Partial<ImportGameState>;
  return typeof pgn === "string" && pgn.trim() ? { pgn, review: review === true } : null;
};
