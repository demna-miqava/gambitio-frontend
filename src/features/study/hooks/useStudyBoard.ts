import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Chess, type PieceSymbol, type Square } from "chess.js";
import type { Key } from "@lichess-org/chessground/types";
import type { DrawShape } from "@lichess-org/chessground/draw";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { useChessSound } from "@/features/game/contexts/ChessSoundContext";
import { useSettings } from "@/features/settings/SettingsContext";
import { syncBoard } from "@/features/game/utils/board-utils";
import { isPromotionMove } from "@/features/game/utils/promotionUtils";
import type { PlayerColor } from "@/features/game/types/game.types";
import type { StudyClientMessage, StudyNode } from "../types";
import { sameShapes, toStudyShapes } from "../utils/studyState";

export interface StudyPendingPromotion {
  from: Square;
  to: Square;
  color: PlayerColor;
}

/**
 * Keeps the board on the room's shared position and turns what the user
 * does on it into room changes: moves (from the shared position, either
 * side) and arrows / circles drawn with the right mouse button. Arrows
 * aren't erased by a click here, since they belong to everyone; drawing the
 * same arrow again removes it.
 */
export const useStudyBoard = ({
  node,
  send,
  resetKey,
}: {
  /** The shared position */
  node: StudyNode;
  send: (message: StudyClientMessage) => void;
  /** Changes when the board must be put back on `node` */
  resetKey: number;
}) => {
  const { cgRef, chessRef, setTurn } = useChessBoardContext();
  const { playSound } = useChessSound();
  const { settings } = useSettings();
  const [pendingPromotion, setPendingPromotion] = useState<StudyPendingPromotion | null>(null);

  // Read from board callbacks, which chessground keeps between renders
  const nodeRef = useRef(node);
  const autoQueenRef = useRef(settings?.autoPromoteToQueenEnabled ?? false);
  useEffect(() => {
    nodeRef.current = node;
    autoQueenRef.current = settings?.autoPromoteToQueenEnabled ?? false;
  });

  // The board is created in ChessBoardProvider's layout effect, which runs
  // after ours on the first render: sync again once it exists
  const [boardReady, setBoardReady] = useState(false);
  useEffect(() => setBoardReady(true), []);

  // The position: on a new node, or when the board must be reset
  const previousNode = useRef<StudyNode | null>(null);
  useLayoutEffect(() => {
    const cg = cgRef.current;
    if (!cg) return;
    chessRef.current.load(node.fen);
    const turn = syncBoard({
      cg,
      chess: chessRef.current,
      movableColor: "both",
      lastMove: node.uci ? [node.uci.slice(0, 2) as Key, node.uci.slice(2, 4) as Key] : undefined,
    });
    setTurn(turn);
    setPendingPromotion(null);
    // Sound for a single step forward (a move played or replayed)
    const prev = previousNode.current;
    if (prev && node.san && node.parentId === prev.id) {
      playSound(node.san.endsWith("#") ? "generic" : node.san.includes("x") ? "capture" : "move");
    }
    previousNode.current = node;
    // node.fen is the position; other node fields (comment, shapes) don't move pieces
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id, node.fen, resetKey, boardReady, cgRef, chessRef, setTurn, playSound]);

  // Arrows and circles of the shared position (setShapes doesn't call onChange)
  useLayoutEffect(() => {
    cgRef.current?.setShapes(node.shapes as DrawShape[]);
  }, [cgRef, node.id, node.shapes, resetKey, boardReady]);

  const sendMove = useCallback(
    (from: string, to: string, promotion?: string) => {
      send({ type: "move", nodeId: nodeRef.current.id, uci: `${from}${to}${promotion ?? ""}` });
    },
    [send]
  );

  useEffect(() => {
    if (!boardReady) return;
    cgRef.current?.set({
      drawable: {
        eraseOnClick: false,
        onChange: (shapes) => {
          const current = nodeRef.current;
          const next = toStudyShapes(shapes);
          if (!sameShapes(next, current.shapes)) {
            send({ type: "shapes", nodeId: current.id, shapes: next });
          }
        },
      },
      events: {
        move: (orig, dest) => {
          const chess = new Chess(nodeRef.current.fen);
          const piece = chess.get(orig as Square);
          if (isPromotionMove(dest as Square, piece) && !autoQueenRef.current) {
            setPendingPromotion({
              from: orig as Square,
              to: dest as Square,
              color: chess.turn() === "w" ? "white" : "black",
            });
            return;
          }
          sendMove(orig, dest, isPromotionMove(dest as Square, piece) ? "q" : undefined);
        },
      },
    });
  }, [cgRef, send, sendMove, boardReady]);

  const selectPromotion = useCallback(
    (piece: PieceSymbol) => {
      if (!pendingPromotion) return;
      sendMove(pendingPromotion.from, pendingPromotion.to, piece);
      setPendingPromotion(null);
    },
    [pendingPromotion, sendMove]
  );

  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null);
    // Put the pawn back
    const cg = cgRef.current;
    if (!cg) return;
    chessRef.current.load(nodeRef.current.fen);
    syncBoard({ cg, chess: chessRef.current, movableColor: "both" });
  }, [cgRef, chessRef]);

  /** Plays a typed move ("Nf3", "e2e4") from the shared position. Returns an error, or null. */
  const playTyped = useCallback(
    (text: string): string | null => {
      const chess = new Chess(nodeRef.current.fen);
      const input = text.trim();
      let move;
      try {
        move = /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(input)
          ? chess.move({ from: input.slice(0, 2), to: input.slice(2, 4), promotion: input[4] ?? "q" })
          : chess.move(input);
      } catch {
        return `"${input}" isn't a legal move here.`;
      }
      sendMove(move.from, move.to, move.promotion);
      return null;
    },
    [sendMove]
  );

  const clearShapes = useCallback(() => {
    const current = nodeRef.current;
    if (current.shapes.length === 0) return;
    cgRef.current?.setShapes([]);
    send({ type: "shapes", nodeId: current.id, shapes: [] });
  }, [cgRef, send]);

  return { pendingPromotion, selectPromotion, cancelPromotion, playTyped, clearShapes };
};
