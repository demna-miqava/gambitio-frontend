import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { PieceSymbol, Square } from "chess.js";
import type { Key } from "@lichess-org/chessground/types";
import { toast } from "sonner";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { useChessSound } from "@/features/game/contexts/ChessSoundContext";
import { useArrowKeyNavigation } from "@/features/game/hooks/useArrowKeyNavigation";
import { useSettings } from "@/features/settings/SettingsContext";
import { syncBoard } from "@/features/game/utils/board-utils";
import { isPromotionMove } from "@/features/game/utils/promotionUtils";
import type { PlayerColor } from "@/features/game/types/game.types";
import { useAnalysisTree } from "../hooks/useAnalysisTree";
import * as Tree from "../utils/analysisTree";
import { planTypedMove } from "../utils/typedMove";
import { positionAnnouncement } from "../utils/announce";
import { toPgn } from "../utils/pgn";
import { downloadBlob } from "@/features/share-gif/utils/deliver";
import type { AnalysisNode, NodePath } from "../types/analysis.types";

interface PendingPromotion {
  from: Square;
  to: Square;
  color: PlayerColor;
}

interface ArchiveGameContextValue {
  root: AnalysisNode;
  path: NodePath;
  currentNode: AnalysisNode;
  isInVariation: boolean;
  hasAnalysis: boolean;
  isAtStart: boolean;
  isAtEnd: boolean;

  goToStart: () => void;
  goToEnd: () => void;
  goForward: () => void;
  goBack: () => void;
  goTo: (path: NodePath) => void;
  backToMainLine: () => void;

  /** Plays a UCI move (e.g. from an engine line) from the current position */
  playUci: (uci: string) => void;
  /** Plays a typed move ("Nf3", "e2e4") like a board move. Returns an error message, or null. */
  submitTypedMove: (text: string) => string | null;
  promoteVariation: () => void;
  deleteVariation: () => void;
  resetAnalysis: () => void;
  copyPgn: () => void;
  /** Saves the PGN (with variations) as a .pgn file */
  downloadPgn: () => void;
  /** The PGN headers (players, date...), if this is a game */
  getHeaders: () => Record<string, string> | undefined;

  pendingPromotion: PendingPromotion | null;
  handlePromotionSelect: (piece: PieceSymbol) => void;
  cancelPromotion: () => void;
}

const ArchiveGameContext = createContext<ArchiveGameContextValue | null>(null);

interface ArchiveGameProviderProps {
  children: ReactNode;
  pgn?: string;
  /** Saves analysis in this browser under this key (e.g. "game:42") */
  storageKey?: string;
  /** PGN headers used when copying the analysis */
  headers?: Record<string, string>;
}

/**
 * Analysis of a game, an imported PGN, or a free board. Holds the move tree
 * and keeps the board in sync with the current node; all tree logic lives in
 * utils/analysisTree.ts.
 */
export const ArchiveGameProvider = ({
  children,
  pgn,
  storageKey,
  headers,
}: ArchiveGameProviderProps) => {
  const { chessRef, cgRef, setTurn } = useChessBoardContext();
  const { playSound } = useChessSound();
  const { settings } = useSettings();
  const {
    root,
    path,
    currentNode,
    setPath,
    isInVariation,
    hasAnalysis,
    addMove,
    deleteVariation: deleteVariationFromTree,
    promoteVariation,
    resetAnalysis: resetTree,
    restore,
  } = useAnalysisTree({ pgn, storageKey });
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);

  // Board follows the current node. Layout effect so the board never paints
  // a stale position.
  const syncBoardTo = useCallback(
    (node: AnalysisNode) => {
      // Even before the board exists: on mount this runs ahead of
      // ChessBoardProvider's layout effect (children's run first), which then
      // creates the board from chessRef, so a tree that starts from a set-up
      // position (FEN header) shows it from the first paint
      chessRef.current.load(node.fen);
      const cg = cgRef.current;
      if (!cg) return;
      const turn = syncBoard({
        cg,
        chess: chessRef.current,
        movableColor: "both",
        lastMove: node.move ? [node.move.from as Key, node.move.to as Key] : undefined,
      });
      setTurn(turn);
    },
    [cgRef, chessRef, setTurn]
  );

  // Read out each new position (not the one shown on load)
  const [announcement, setAnnouncement] = useState("");
  const announcedNode = useRef(currentNode);
  useEffect(() => {
    if (announcedNode.current === currentNode) return;
    // Same position after an edit elsewhere in the tree: nothing to say
    const moved = announcedNode.current.id !== currentNode.id;
    announcedNode.current = currentNode;
    if (moved) setAnnouncement(positionAnnouncement(currentNode, isInVariation));
  }, [currentNode, isInVariation]);

  const previousNode = useRef<AnalysisNode | null>(null);
  useLayoutEffect(() => {
    syncBoardTo(currentNode);
    // Sound only for a single step forward (playing or replaying a move)
    const prev = previousNode.current;
    if (prev && currentNode.move && prev.children.some((c) => c.id === currentNode.id)) {
      const { san } = currentNode.move;
      playSound(san.endsWith("#") ? "gameEnd" : san.includes("x") ? "capture" : "move");
    }
    previousNode.current = currentNode;
  }, [currentNode, syncBoardTo, playSound]);

  const goTo = useCallback((next: NodePath) => setPath(next), [setPath]);
  const goToStart = useCallback(() => setPath([]), [setPath]);
  const goToEnd = useCallback(() => setPath(Tree.endOfLine(root, path)), [root, path, setPath]);
  const goBack = useCallback(() => setPath(path.slice(0, -1)), [path, setPath]);
  const goForward = useCallback(() => {
    const next = currentNode.children[0];
    if (next) setPath([...path, next.id]);
  }, [currentNode, path, setPath]);
  const backToMainLine = useCallback(() => {
    // Stay at the same move number, on the main line
    const mainPath = Tree.mainLineAncestor(root, path);
    const branchPoint = Tree.nodeAt(root, mainPath);
    const mainNext = branchPoint.children[0];
    setPath(mainNext ? [...mainPath, mainNext.id] : mainPath);
  }, [root, path, setPath]);

  const play = useCallback(
    (from: string, to: string, promotion?: string) => {
      const chess = Tree.chessAt(currentNode);
      try {
        const move = chess.move({ from, to, ...(promotion ? { promotion } : {}) });
        addMove(move);
      } catch {
        // Illegal (shouldn't happen: the board only offers legal moves)
        syncBoardTo(currentNode);
      }
    },
    [currentNode, addMove, syncBoardTo]
  );

  const handleBoardMove = useCallback(
    (orig: Key, dest: Key) => {
      const chess = Tree.chessAt(currentNode);
      const piece = chess.get(orig as Square);
      if (isPromotionMove(dest as Square, piece)) {
        if (settings?.autoPromoteToQueenEnabled) {
          play(orig, dest, "q");
        } else {
          setPendingPromotion({
            from: orig as Square,
            to: dest as Square,
            color: chess.turn() === "w" ? "white" : "black",
          });
        }
        return;
      }
      play(orig, dest);
    },
    [currentNode, settings?.autoPromoteToQueenEnabled, play]
  );

  const handlePromotionSelect = useCallback(
    (piece: PieceSymbol) => {
      if (!pendingPromotion) return;
      play(pendingPromotion.from, pendingPromotion.to, piece);
      setPendingPromotion(null);
    },
    [pendingPromotion, play]
  );

  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null);
    syncBoardTo(currentNode); // put the pawn back
  }, [currentNode, syncBoardTo]);

  const playUci = useCallback(
    (uci: string) => play(uci.slice(0, 2), uci.slice(2, 4), uci[4]),
    [play]
  );

  // Same path as a board move: variations, promotion picker / auto-queen
  const submitTypedMove = useCallback(
    (text: string) => {
      const plan = planTypedMove(currentNode, text);
      if (plan.kind === "error") return plan.message;
      if (plan.kind === "promote") handleBoardMove(plan.from, plan.to);
      else play(plan.from, plan.to, plan.promotion);
      return null;
    },
    [currentNode, handleBoardMove, play]
  );

  useEffect(() => {
    cgRef.current?.set({ events: { move: handleBoardMove } });
  }, [cgRef, handleBoardMove]);

  const offerUndo = useCallback(
    (message: string, previous: AnalysisNode, previousPath: NodePath) => {
      toast(message, {
        duration: 8000,
        action: { label: "Undo", onClick: () => restore(previous, previousPath) },
      });
    },
    [restore]
  );

  const deleteVariation = useCallback(() => {
    const previousPath = path;
    const previous = deleteVariationFromTree();
    if (previous) offerUndo("Variation deleted", previous, previousPath);
  }, [path, deleteVariationFromTree, offerUndo]);

  const resetAnalysis = useCallback(() => {
    const previousPath = path;
    const previous = resetTree();
    offerUndo("Analysis cleared. Moves and variations were removed.", previous, previousPath);
  }, [path, resetTree, offerUndo]);

  // Only read when copying, so a new headers object each render doesn't
  // invalidate the context value
  const headersRef = useRef(headers);
  useEffect(() => {
    headersRef.current = headers;
  }, [headers]);

  const getHeaders = useCallback(() => headersRef.current, []);

  const copyPgn = useCallback(() => {
    navigator.clipboard
      .writeText(toPgn(root, headersRef.current))
      .then(() => toast.success("PGN copied"))
      .catch(() => toast.error("Couldn't copy to the clipboard"));
  }, [root]);

  const downloadPgn = useCallback(() => {
    const { White, Black } = headersRef.current ?? {};
    const name = White && Black ? `${White}-vs-${Black}` : "analysis";
    // Keeps the blob URL alive until the download has started
    downloadBlob(
      new Blob([toPgn(root, headersRef.current)], { type: "application/x-chess-pgn" }),
      `${name.replace(/[^\w.-]+/g, "_")}.pgn`
    );
  }, [root]);

  useArrowKeyNavigation({
    onLeft: goBack,
    onRight: goForward,
    onUp: goToStart,
    onDown: goToEnd,
    onHome: goToStart,
    onEnd: goToEnd,
  });

  const value = useMemo<ArchiveGameContextValue>(
    () => ({
      root,
      path,
      currentNode,
      isInVariation,
      hasAnalysis,
      isAtStart: path.length === 0,
      isAtEnd: currentNode.children.length === 0,
      goToStart,
      goToEnd,
      goForward,
      goBack,
      goTo,
      backToMainLine,
      playUci,
      submitTypedMove,
      promoteVariation,
      deleteVariation,
      resetAnalysis,
      copyPgn,
      downloadPgn,
      getHeaders,
      pendingPromotion,
      handlePromotionSelect,
      cancelPromotion,
    }),
    [
      root,
      path,
      currentNode,
      isInVariation,
      hasAnalysis,
      promoteVariation,
      goToStart,
      goToEnd,
      goForward,
      goBack,
      goTo,
      backToMainLine,
      playUci,
      submitTypedMove,
      deleteVariation,
      resetAnalysis,
      copyPgn,
      downloadPgn,
      getHeaders,
      pendingPromotion,
      handlePromotionSelect,
      cancelPromotion,
    ]
  );

  return (
    <ArchiveGameContext.Provider value={value}>
      {children}
      {/* Moves played or stepped through, read out politely */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </ArchiveGameContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useArchiveGame = () => {
  const context = useContext(ArchiveGameContext);
  if (!context) {
    throw new Error("useArchiveGame must be used within ArchiveGameProvider");
  }
  return context;
};
