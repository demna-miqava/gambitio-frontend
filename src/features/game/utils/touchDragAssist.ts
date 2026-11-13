import type { Api } from "@lichess-org/chessground/api";
import type { Key } from "@lichess-org/chessground/types";

/**
 * Makes dragging pieces with a finger easier to follow. Chessground keeps the
 * dragged piece centred under the touch point, so on a phone the finger hides
 * both the piece and the square it's about to land on. While a touch drag is
 * under way (past chessground's few-pixel threshold, so taps are unaffected):
 *  - the board's wrap gets `touch-dragging`, which index.css uses to enlarge
 *    the dragged piece and lift it above the finger
 *  - a halo (<cg-drag-target>) marks the square under the finger, which is
 *    where the piece will drop
 * It also handles touchcancel, which chessground ignores: without it a drag
 * cut short by the browser or OS left the piece stuck mid-board, and the next
 * tap only cleared it instead of selecting.
 *
 * Returns a function that removes the listeners.
 */
export const attachTouchDragAssist = (cg: Api): (() => void) => {
  const marker = document.createElement("cg-drag-target");
  let frame = 0;
  let shownKey: Key | undefined;

  const clear = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    shownKey = undefined;
    marker.remove();
    cg.state.dom.elements.wrap.classList.remove("touch-dragging");
  };

  const update = () => {
    frame = 0;
    const cur = cg.state.draggable.current;
    if (!cur) return clear();
    if (!cur.started) return;

    const { wrap, container } = cg.state.dom.elements;
    wrap.classList.add("touch-dragging");

    const key = cg.getKeyAtDomPos(cur.pos);
    if (!key) {
      shownKey = undefined;
      marker.remove();
      return;
    }
    // The container is rebuilt if chessground redraws everything
    if (marker.parentNode !== container) container.appendChild(marker);
    if (key === shownKey) return;
    shownKey = key;
    const file = key.charCodeAt(0) - 97;
    const rank = Number(key[1]) - 1;
    const asWhite = cg.state.orientation === "white";
    const x = asWhite ? file : 7 - file;
    const y = asWhite ? 7 - rank : rank;
    marker.style.transform = `translate(${x * 100}%, ${y * 100}%)`;
  };

  // Runs after chessground's own document listeners (bound when the board was
  // created), so the drag position is already up to date
  const onMove = () => {
    if (!frame && cg.state.draggable.current) frame = requestAnimationFrame(update);
  };

  const onCancel = () => {
    const s = cg.state;
    if (s.draggable.current) {
      // What chessground's drag.cancel does; it isn't exposed on the Api
      s.draggable.current = undefined;
      cg.selectSquare(null);
      if (s.dom.elements.ghost) s.dom.elements.ghost.style.visibility = "hidden";
      s.dom.redraw();
    }
    clear();
  };

  const opts: AddEventListenerOptions = { passive: true };
  document.addEventListener("touchmove", onMove, opts);
  document.addEventListener("touchend", clear, opts);
  document.addEventListener("touchcancel", onCancel, opts);

  return () => {
    document.removeEventListener("touchmove", onMove, opts);
    document.removeEventListener("touchend", clear, opts);
    document.removeEventListener("touchcancel", onCancel, opts);
    clear();
  };
};
