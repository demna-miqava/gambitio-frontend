import { useShortcutKey } from "./useShortcutKey";

/** "F" flips the board, as on most chess sites. */
export const useFlipBoardKey = (flip: () => void) => useShortcutKey("f", flip);
