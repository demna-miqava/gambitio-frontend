import { useEffect, useLayoutEffect, useRef } from "react";
import { Chessground } from "@lichess-org/chessground";
import type { Api } from "@lichess-org/chessground/api";
import type { Config } from "@lichess-org/chessground/config";
import { attachTouchDragAssist } from "../utils/touchDragAssist";
import { withBoardSettings, type BoardLook } from "./useBoardSettings";

interface UseChessgroundOptions {
  /** Easier finger dragging (attachTouchDragAssist), for boards pieces move on */
  dragAssist?: boolean;
  /**
   * The user's board settings (useBoardSettings): applied when the board is
   * created and again whenever they change. Leave out for boards with fixed
   * looks (previews, decorations).
   */
  settings?: BoardLook;
}

/**
 * A chessground board in the element at boardRef, created once on mount from
 * `initialConfig` (read then, never again: change the board through cgRef)
 * and destroyed on unmount. cgRef is null before and after.
 */
export const useChessground = (
  initialConfig: () => Config,
  { dragAssist = false, settings }: UseChessgroundOptions = {}
) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  const pendingDestroyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const detachDragAssistRef = useRef<(() => void) | null>(null);

  // A layout effect, so the board exists before any child's useEffect runs
  // (effects run child-first) and before the caller's own effects: children
  // attach move handlers and sync positions from their own effects.
  useLayoutEffect(() => {
    // Remounted right after a cleanup (React StrictMode in development):
    // keep the existing board, since child components have already attached
    // their move handlers to it
    if (pendingDestroyRef.current) {
      clearTimeout(pendingDestroyRef.current);
      pendingDestroyRef.current = null;
    }
    const scheduleDestroy = () => {
      // Chessground adds document-level mouse/touch/scroll listeners that only
      // destroy() removes; deferred so a StrictMode remount can cancel it
      pendingDestroyRef.current = setTimeout(() => {
        pendingDestroyRef.current = null;
        detachDragAssistRef.current?.();
        detachDragAssistRef.current = null;
        cgRef.current?.destroy();
        cgRef.current = null;
      }, 0);
    };
    if (!boardRef.current || cgRef.current) return scheduleDestroy;
    const config = initialConfig();
    cgRef.current = Chessground(boardRef.current, settings ? withBoardSettings(config, settings) : config);
    if (dragAssist) detachDragAssistRef.current = attachTouchDragAssist(cgRef.current);
    return scheduleDestroy;
    // Created once; later changes go through cgRef (settings: below)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Settings changed: the board follows (a board without settings keeps its looks)
  const followsSettings = settings !== undefined;
  const coordinates = settings?.coordinates ?? false;
  const highlightLastMove = settings?.highlightLastMove ?? false;
  const premoves = settings?.premoves ?? false;
  const showDests = settings?.showDests ?? false;
  useEffect(() => {
    const cg = cgRef.current;
    if (!cg || !followsSettings) return;
    cg.set(withBoardSettings({}, { coordinates, highlightLastMove, premoves, showDests }));
    // A premove already queued would still play
    if (!premoves) cg.cancelPremove();
  }, [followsSettings, coordinates, highlightLastMove, premoves, showDests]);

  return { boardRef, cgRef };
};
