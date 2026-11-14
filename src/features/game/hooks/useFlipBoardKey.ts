import { useEffect } from "react";

// Keys typed here are text, not shortcuts
const TYPING_TARGETS = "input, textarea, select, [contenteditable='true']";

/** "F" flips the board, as on most chess sites. */
export const useFlipBoardKey = (flip: () => void) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "f" && event.key !== "F") return;
      if (event.defaultPrevented || event.repeat) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof Element && event.target.closest(TYPING_TARGETS)) return;
      event.preventDefault();
      flip();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flip]);
};
