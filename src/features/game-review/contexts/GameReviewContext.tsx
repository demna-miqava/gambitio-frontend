import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useArchiveGame } from "@/features/archive-game/contexts/ArchiveGameContext";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import type { NodePath } from "@/features/archive-game/types/analysis.types";
import { moveLabel } from "@/features/archive-game/utils/analysisTree";
import type { GameReview, MoveReview, Side } from "../types";
import { gameFingerprint, gamePositions, getGameLine, toReviewMoves } from "../utils/gameLine";
import { useGameReviewQuery, type ReviewProgress } from "../hooks/useGameReviewQuery";
import { firstReviewMoment } from "../utils/reviewStart";

export type GameReviewStatus = "empty" | "idle" | "running" | "error" | "ready";

export interface GameReviewContextValue {
  status: GameReviewStatus;
  progress: ReviewProgress | null;
  review: GameReview | null;
  error: Error | null;
  start: () => void;
  cancel: () => void;
  retry: () => void;
  players: { white: string; black: string };
  /** Path to each position of the game (index 0 = start) */
  positionPaths: NodePath[];
  /** Label for each position: "Start", "1. e4", "1... e5", … */
  positionLabels: string[];
  /** Index of the current position in the game, or -1 when in a variation */
  currentIndex: number;
  /** The review of a move node, if it's a game move and the review is ready */
  moveReviewFor: (nodeId: string) => MoveReview | undefined;
  goToPosition: (index: number) => void;
}

const GameReviewContext = createContext<GameReviewContextValue | null>(null);

interface GameReviewProviderProps {
  children: ReactNode;
  /** Persist the review in this browser under this id (e.g. "game:42") */
  storageId?: string;
  players?: { white: string; black: string };
  /** Start the review on mount (once) unless a stored review is already there */
  autoStart?: boolean;
  /**
   * Whose mistakes to jump to when the review is done. Defaults to the side
   * the board is shown from (the player's own side on their games); null
   * for either side.
   */
  userSide?: Side | null;
}

const samePath = (a: NodePath, b: NodePath) => a.length === b.length && a.every((id, i) => id === b[i]);

const DEFAULT_PLAYERS = { white: "White", black: "Black" };

/**
 * Computer review of the game loaded in the surrounding ArchiveGameProvider.
 * Reviews the game's own moves (not analysis variations).
 */
export const GameReviewProvider = ({
  children,
  storageId,
  players = DEFAULT_PLAYERS,
  autoStart = false,
  userSide,
}: GameReviewProviderProps) => {
  const { root, path, currentNode, goTo } = useArchiveGame();
  const { color: orientation } = useChessBoardContext();
  const side = userSide === undefined ? orientation : (userSide ?? undefined);

  // The tree is rebuilt on every analysis edit; the game itself only changes
  // when its fingerprint does
  const line = useMemo(() => getGameLine(root), [root]);
  const moves = useMemo(() => toReviewMoves(root, line), [root, line]);
  const positions = useMemo(() => gamePositions(root, line), [root, line]);
  const fingerprint = gameFingerprint(root.fen, moves);

  const { query, progress, start: startQuery, cancel, retry: retryQuery } = useGameReviewQuery({
    startFen: root.fen,
    moves,
    positions,
    fingerprint,
    storageId,
  });

  const review = query.data ?? null;
  const status: GameReviewStatus =
    moves.length === 0
      ? "empty"
      : review
        ? "ready"
        : query.isError
          ? "error"
          : query.fetchStatus === "fetching"
            ? "running"
            : "idle";

  // When a review the player asked for is ready, go to their first mistake
  // (see firstReviewMoment), unless they've moved on while it ran. This is
  // the position they were on when they asked.
  const pathRef = useRef(path);
  useEffect(() => {
    pathRef.current = path;
  }, [path]);
  const jumpFrom = useRef<NodePath | null>(null);

  const start = useCallback(() => {
    jumpFrom.current = pathRef.current;
    startQuery();
  }, [startQuery]);
  const retry = useCallback(() => {
    jumpFrom.current = pathRef.current;
    retryQuery();
  }, [retryQuery]);

  const autoStarted = useRef(false);
  useEffect(() => {
    if (!autoStart || autoStarted.current || status === "empty" || status === "error") return;
    autoStarted.current = true;
    // Already reviewed (stored) or running: still go to the first mistake
    if (status === "idle") start();
    else jumpFrom.current = pathRef.current;
  }, [autoStart, status, start]);

  const byNodeId = useMemo(() => {
    const map = new Map<string, MoveReview>();
    if (!review) return map;
    line.forEach(({ node }, i) => {
      const move = review.moves[i];
      if (move) map.set(node.id, move);
    });
    return map;
  }, [line, review]);

  const positionPaths = useMemo(() => [[], ...line.map((entry) => entry.path)], [line]);

  useEffect(() => {
    const from = jumpFrom.current;
    if (status !== "ready" || !review || from === null) return;
    jumpFrom.current = null;
    if (!samePath(from, pathRef.current)) return;
    const index = firstReviewMoment(review.moves, side);
    const target = index === null ? undefined : positionPaths[index];
    if (target) goTo(target);
  }, [status, review, side, positionPaths, goTo]);

  const positionLabels = useMemo(() => ["Start", ...line.map((entry) => moveLabel(entry.node))], [line]);
  const lineIndex = line.findIndex((entry) => entry.node.id === currentNode.id);
  const currentIndex = currentNode.id === root.id ? 0 : lineIndex === -1 ? -1 : lineIndex + 1;

  const value = useMemo<GameReviewContextValue>(
    () => ({
      status,
      progress,
      review,
      error: query.error,
      start,
      cancel,
      retry,
      players,
      positionPaths,
      positionLabels,
      currentIndex,
      moveReviewFor: (id) => byNodeId.get(id),
      goToPosition: (index) => {
        const path = positionPaths[index];
        if (path) goTo(path);
      },
    }),
    [status, progress, review, query.error, start, cancel, retry, players, positionPaths, positionLabels, currentIndex, byNodeId, goTo]
  );

  return <GameReviewContext.Provider value={value}>{children}</GameReviewContext.Provider>;
};

/** The game review, or null where none is offered (e.g. the free analysis board). */
// eslint-disable-next-line react-refresh/only-export-components
export const useGameReview = () => useContext(GameReviewContext);
