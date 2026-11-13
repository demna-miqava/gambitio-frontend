import { useEffect } from "react";

interface ArrowKeyHandlers {
  onLeft?: () => void;
  onRight?: () => void;
  onUp?: () => void;
  onDown?: () => void;
  /** Home: defaults to onUp (first move) */
  onHome?: () => void;
  /** End: defaults to onDown (last move) */
  onEnd?: () => void;
}

// Widgets that use arrow keys (and Home/End) themselves
const ARROW_KEY_WIDGETS =
  "input, textarea, select, [role='listbox'], [role='menu'], [role='radiogroup'], [role='tablist'], [role='slider']";

/** True when ↑/↓ would scroll something: the page, or a scroll box around the focus. */
const canScrollVertically = (target: Element | null) => {
  const page = document.scrollingElement ?? document.documentElement;
  if (page.scrollHeight > page.clientHeight) return true;
  for (let el = target; el && el !== page; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el);
    if ((overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight) {
      return true;
    }
  }
  return false;
};

/**
 * ←/→ step through the moves. ↑/↓ jump to the first/last move only when the
 * page has nothing to scroll; otherwise they keep scrolling the page, so
 * keyboard users can still reach everything below the board. Home/End always
 * jump to the first/last move (outside text fields and other widgets).
 * Used by both live game move navigation and archive game analysis.
 */
export const useArrowKeyNavigation = ({
  onLeft,
  onRight,
  onUp,
  onDown,
  onHome = onUp,
  onEnd = onDown,
}: ArrowKeyHandlers) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't hijack keys while typing (PGN box, typed move, search) or with modifiers
      if (event.defaultPrevented) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const target = event.target instanceof Element ? event.target : null;
      if (
        (target instanceof HTMLElement && target.isContentEditable) ||
        target?.closest(ARROW_KEY_WIDGETS)
      ) {
        return;
      }
      switch (event.key) {
        case "ArrowLeft":
          if (!onLeft) return;
          event.preventDefault();
          onLeft();
          break;
        case "ArrowRight":
          if (!onRight) return;
          event.preventDefault();
          onRight();
          break;
        case "ArrowUp":
          if (!onUp || canScrollVertically(target)) return;
          event.preventDefault();
          onUp();
          break;
        case "ArrowDown":
          if (!onDown || canScrollVertically(target)) return;
          event.preventDefault();
          onDown();
          break;
        case "Home":
          if (!onHome) return;
          event.preventDefault();
          onHome();
          break;
        case "End":
          if (!onEnd) return;
          event.preventDefault();
          onEnd();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onLeft, onRight, onUp, onDown, onHome, onEnd]);
};
