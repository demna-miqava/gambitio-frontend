import { useEffect } from "react";

// Keys typed here are text, not shortcuts
const TYPING_TARGETS = "input, textarea, select, [contenteditable='true']";

/**
 * Runs `action` when a letter key is pressed on its own (either case), not
 * while typing in a field or holding a modifier, and not on key repeat.
 */
export const useShortcutKey = (key: string, action: () => void, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;
    const wanted = key.toLowerCase();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== wanted) return;
      if (event.defaultPrevented || event.repeat) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof Element && event.target.closest(TYPING_TARGETS)) return;
      event.preventDefault();
      action();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [key, action, enabled]);
};
