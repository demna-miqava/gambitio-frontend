import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Move } from "chess.js";
import type { AnalysisNode, NodePath } from "../types/analysis.types";
import * as Tree from "../utils/analysisTree";
import { parsePgn, toPgn } from "../utils/pgn";

const STORAGE_PREFIX = "gambitio:analysis:";

function parseOrEmpty(pgn: string | undefined) {
  if (!pgn) return Tree.createRoot();
  try {
    return parsePgn(pgn).root;
  } catch {
    return Tree.createRoot();
  }
}

function loadInitialTree(pgn: string | undefined, storageKey: string | undefined) {
  const game = parseOrEmpty(pgn);
  if (!storageKey) return game;
  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + storageKey);
    if (!saved) return game;
    const restored = parsePgn(saved).root;
    if (restored.fen !== game.fen) return game;
    // A promoted variation may now be the saved main line, so "game move"
    // means "matches the real game", not "is on the saved main line".
    // With no game (analysis board) every saved move is analysis.
    return Tree.markGameMoves(restored, game);
  } catch {
    // Corrupt or outdated save: fall back to the game itself
    return game;
  }
}

interface UseAnalysisTreeOptions {
  /** The game (may contain variations) */
  pgn?: string;
  /** Saves the analysis in localStorage under this key and restores it on load */
  storageKey?: string;
}

/**
 * State for an analysis session: the move tree and the current path.
 * Edits are immutable, so undo is just keeping the previous root.
 */
export const useAnalysisTree = ({ pgn, storageKey }: UseAnalysisTreeOptions = {}) => {
  const [root, setRoot] = useState<AnalysisNode>(() => loadInitialTree(pgn, storageKey));
  const [path, setPath] = useState<NodePath>([]);
  const lastSaved = useRef<AnalysisNode | null>(null);

  // Persist after edits (not on navigation). Nothing to save means no entry.
  useEffect(() => {
    if (!storageKey || lastSaved.current === root) return;
    lastSaved.current = root;
    const key = STORAGE_PREFIX + storageKey;
    try {
      if (Tree.hasAnalysis(root) || !pgn) localStorage.setItem(key, toPgn(root));
      else localStorage.removeItem(key);
    } catch {
      // Storage full or disabled: analysis just isn't saved
    }
  }, [root, storageKey, pgn]);

  const nodes = useMemo(() => Tree.nodesAlong(root, path), [root, path]);
  const currentNode = nodes[nodes.length - 1]!;

  const addMove = useCallback(
    (move: Move) => {
      const result = Tree.addMove(root, path, move);
      setRoot(result.root);
      setPath(result.path);
      return result.path;
    },
    [root, path]
  );

  /** Removes the variation the current move belongs to (from the point it branched off). */
  const deleteVariation = useCallback(() => {
    const mainPath = Tree.mainLineAncestor(root, path);
    if (mainPath.length === path.length) return null;
    const branchPath = path.slice(0, mainPath.length + 1);
    const previous = root;
    setRoot(Tree.deleteNode(root, branchPath));
    setPath(mainPath);
    return previous;
  }, [root, path]);

  const promoteVariation = useCallback(() => {
    setRoot(Tree.promoteVariation(root, path));
  }, [root, path]);

  /** Back to the original game. Returns the previous tree so the caller can offer undo. */
  const resetAnalysis = useCallback(() => {
    const previous = root;
    const cleared = Tree.clearAnalysis(root, path);
    setRoot(cleared.root);
    setPath(cleared.path);
    return previous;
  }, [root, path]);

  const restore = useCallback((previous: AnalysisNode, previousPath: NodePath) => {
    setRoot(previous);
    setPath(previousPath);
  }, []);

  return {
    root,
    path,
    setPath,
    currentNode,
    nodes,
    isInVariation: !Tree.isMainLine(root, path),
    hasAnalysis: Tree.hasAnalysis(root),
    addMove,
    deleteVariation,
    promoteVariation,
    resetAnalysis,
    restore,
  };
};
