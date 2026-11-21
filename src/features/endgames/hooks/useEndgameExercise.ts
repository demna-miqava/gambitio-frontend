import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Move, type PieceSymbol, type Square } from "chess.js";
import type { Key } from "@lichess-org/chessground/types";
import { calculateLegalMoves } from "@/features/game/utils/board-utils";
import { parseTypedMove } from "@/features/game/utils/parseTypedMove";
import { useMoveNavigation } from "@/features/game/hooks/useMoveNavigation";
import { useChessground } from "@/features/game/hooks/useChessground";
import { useBoardSettings } from "@/features/game/hooks/useBoardSettings";
import { usePromotionPicker } from "@/features/game/hooks/usePromotionPicker";
import { useChessSound } from "@/features/game/contexts/ChessSoundContext";
import { BotEngine, type EngineScore } from "@/features/play-bots/services/botEngine";
import type { ObjectiveEvaluation, PracticePosition } from "../types";
import { conversionVerdict, countPlayerMoves, evaluateObjective, hasSlipped } from "../utils/objective";
import { useBoardOrientation } from "@/features/game/hooks/useBoardOrientation";

/** Full strength: the engine always finds the toughest defence (or attack). */
export const ENDGAME_ENGINE_RATING = 3500;
/** Enough for best play in these positions, quick enough to retry fast. */
const ENGINE_MOVE_TIME_MS = 600;
/**
 * A conversion starts from a middlegame as often as an endgame: the engine
 * thinks longer, so it defends as well as it can.
 */
const CONVERSION_MOVE_TIME_MS = 1000;
/** The engine never replies faster than this, so its move can be followed. */
const MIN_REPLY_MS = 350;

const PLAYING: ObjectiveEvaluation = { status: "playing", message: "" };

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const lastMoveOf = (chess: Chess): [Key, Key] | undefined => {
  const last = chess.history({ verbose: true }).at(-1);
  return last ? [last.from, last.to] : undefined;
};

/**
 * An endgame exercise against Stockfish in the browser: the board starts
 * from the exercise's position, the engine answers every move, and the
 * objective is checked after each one. `retry` resets the position at once,
 * keeping the engine; a reply still on its way for an earlier attempt is
 * dropped.
 *
 * Conversion drills play through here too (objective "convert"): the
 * engine's score after each of the player's moves decides when it resigns
 * or when the win has slipped (conversionVerdict).
 */
export const useEndgameExercise = (exercise: PracticePosition) => {
  const chessRef = useRef(new Chess(exercise.fen));
  const { playerColor } = exercise;
  const playerCode = playerColor === "white" ? "w" : "b";
  const boardSettings = useBoardSettings();
  // Once per exercise (the page remounts for another one); settings changes
  // are applied by the hook
  const { boardRef, cgRef } = useChessground(
    () => {
      const chess = chessRef.current;
      return {
        fen: chess.fen(),
        orientation: playerColor,
        turnColor: chess.turn() === "w" ? "white" : "black",
        draggable: { enabled: true },
        movable: {
          free: false,
          color: playerColor,
          dests: chess.turn() === playerCode ? calculateLegalMoves(chess) : new Map(),
        },
      };
    },
    { dragAssist: true, settings: boardSettings }
  );
  // The player's side at the bottom until they flip the board (a retry keeps the view)
  const { orientation, flip } = useBoardOrientation(cgRef, exercise.playerColor);
  const engineRef = useRef<BotEngine | null>(null);
  // Engine requests run one after another, so a search for an abandoned
  // attempt can never answer the next one
  const engineQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  const attemptRef = useRef(0);
  const finishedRef = useRef(false);
  /** A conversion's engine scores after each of the player's moves (engine's side) */
  const scoresRef = useRef<EngineScore[]>([]);
  const [engineScore, setEngineScore] = useState<EngineScore | null>(null);
  const converting = exercise.objective.type === "convert";

  const { playSoundForMove, playGameEndSound } = useChessSound();

  const [history, setHistory] = useState<Move[]>([]);
  const [thinking, setThinking] = useState(false);
  const [evaluation, setEvaluation] = useState<ObjectiveEvaluation>(PLAYING);
  const [engineError, setEngineError] = useState(false);
  /** Bumped by every retry; the page records each finished attempt once */
  const [attempt, setAttempt] = useState(0);

  const syncBoard = useCallback(() => {
    const chess = chessRef.current;
    const cg = cgRef.current;
    if (!cg) return;
    const over = finishedRef.current || chess.isGameOver();
    const myTurn = chess.turn() === playerCode && !over;
    cg.set({
      fen: chess.fen(),
      turnColor: chess.turn() === "w" ? "white" : "black",
      check: chess.inCheck(),
      lastMove: lastMoveOf(chess),
      movable: {
        color: over ? undefined : playerColor,
        dests: myTurn ? calculateLegalMoves(chess) : new Map(),
      },
    });
    if (myTurn) cg.playPremove();
  }, [playerCode, playerColor, cgRef]);

  /** After any move: board, history, sound, and the objective. Returns true once the attempt is over. */
  const afterMove = useCallback(
    (move: Move) => {
      const chess = chessRef.current;
      const moves = chess.history({ verbose: true });
      const result = evaluateObjective(exercise, chess, countPlayerMoves(moves, playerColor));
      if (result.status !== "playing") finishedRef.current = true;
      syncBoard();
      setHistory(moves);
      setEvaluation(result);
      playSoundForMove(move, finishedRef.current);
      if (finishedRef.current) cgRef.current?.stop();
      return finishedRef.current;
    },
    [exercise, playerColor, syncBoard, playSoundForMove, cgRef]
  );

  const playEngineMove = useCallback(() => {
    const engine = engineRef.current;
    const chess = chessRef.current;
    if (!engine || finishedRef.current || chess.isGameOver()) return;
    const attemptId = attemptRef.current;
    const fen = chess.fen();
    setThinking(true);
    const request = engineQueueRef.current.then(async () => {
      // Abandoned while waiting its turn
      if (attemptRef.current !== attemptId) return null;
      const minDelay = wait(MIN_REPLY_MS);
      const result = await engine.search(fen, ENDGAME_ENGINE_RATING, {
        moveTime: converting ? CONVERSION_MOVE_TIME_MS : ENGINE_MOVE_TIME_MS,
      });
      await minDelay;
      return result;
    });
    engineQueueRef.current = request.catch(() => {});
    request
      .then((result) => {
        const uci = result?.move;
        // A retry, or the position changed meanwhile: drop the reply
        if (!uci || attemptRef.current !== attemptId || finishedRef.current || chess.fen() !== fen) return;
        if (converting && result.score) {
          scoresRef.current = [...scoresRef.current, result.score];
          setEngineScore(result.score);
          const verdict = conversionVerdict(scoresRef.current);
          if (verdict) {
            // The engine resigns, or the win is gone: its move isn't played
            finishedRef.current = true;
            setEvaluation(verdict);
            syncBoard();
            playGameEndSound();
            cgRef.current?.stop();
            return;
          }
        }
        const move = chess.move({
          from: uci.slice(0, 2) as Square,
          to: uci.slice(2, 4) as Square,
          promotion: (uci[4] as PieceSymbol) || undefined,
        });
        afterMove(move);
      })
      .catch(() => {
        if (attemptRef.current === attemptId) setEngineError(true);
      })
      .finally(() => {
        if (attemptRef.current === attemptId) setThinking(false);
      });
  }, [afterMove, converting, syncBoard, playGameEndSound, cgRef]);

  /** Returns the move played, or null if it wasn't played */
  const playUserMove = useCallback(
    (from: Square, to: Square, promotion?: PieceSymbol): Move | null => {
      const chess = chessRef.current;
      if (finishedRef.current || chess.turn() !== playerCode) return null;
      try {
        const move = chess.move({ from, to, promotion });
        if (!afterMove(move)) playEngineMove();
        return move;
      } catch {
        syncBoard();
        return null;
      }
    },
    [afterMove, playEngineMove, syncBoard, playerCode]
  );

  // The engine, once per exercise (the board is useChessground's)
  useEffect(() => {
    let engine: BotEngine | null = null;
    try {
      const created = new BotEngine();
      engine = created;
      engineRef.current = created;
      // Queued like the searches, so none starts before the engine is set up
      engineQueueRef.current = created
        .newGame(ENDGAME_ENGINE_RATING)
        .catch(() => {
          // Not for an engine destroyed meanwhile (unmount)
          if (engineRef.current === created) setEngineError(true);
        });
    } catch {
      setEngineError(true);
    }

    return () => {
      attemptRef.current += 1; // drop any reply still coming
      engine?.destroy();
      engineRef.current = null;
    };
  }, []);

  // Board moves go through chess.js (and the promotion picker when needed)
  const { pendingPromotion, setPendingPromotion, selectPromotion } = usePromotionPicker(
    cgRef,
    chessRef,
    playUserMove,
    boardSettings.autoQueen
  );

  // Stepping through the moves played. A new move jumps back to the live
  // position (useMoveNavigation resets on a new move count)
  const navigation = useMoveNavigation(history.length);
  const { viewingIndex, goToLastMove } = navigation;
  useEffect(() => {
    const cg = cgRef.current;
    if (!cg) return;
    if (viewingIndex === null) {
      syncBoard();
      return;
    }
    const moves = chessRef.current.history({ verbose: true });
    const shown = moves[viewingIndex - 1];
    const position = new Chess(shown ? shown.after : exercise.fen);
    cg.cancelPremove();
    cg.selectSquare(null);
    cg.set({
      fen: position.fen(),
      turnColor: position.turn() === "w" ? "white" : "black",
      check: position.inCheck(),
      lastMove: shown ? [shown.from, shown.to] : undefined,
      movable: { color: undefined, dests: new Map() },
    });
  }, [viewingIndex, syncBoard, exercise.fen, cgRef]);

  const cancelPromotion = () => {
    setPendingPromotion(null);
    goToLastMove();
    syncBoard();
  };

  /** Back to the starting position, at once. */
  const retry = useCallback(() => {
    attemptRef.current += 1;
    // Cut a search short; its late reply is dropped (stop is harmless when idle)
    engineRef.current?.stop();
    chessRef.current = new Chess(exercise.fen);
    finishedRef.current = false;
    scoresRef.current = [];
    setEngineScore(null);
    setHistory([]);
    setEvaluation(PLAYING);
    setThinking(false);
    setPendingPromotion(null);
    setAttempt((n) => n + 1);
    goToLastMove();
    cgRef.current?.cancelPremove();
    cgRef.current?.selectSquare(null);
    syncBoard();
  }, [exercise.fen, goToLastMove, syncBoard, cgRef, setPendingPromotion]);

  /** Keyboard play (TypedMoveInput). Returns an error message, or null once played. */
  const submitTypedMove = (text: string): string | null => {
    const chess = chessRef.current;
    if (finishedRef.current) return "This attempt is over. Retry to play again.";
    if (engineError) return "The engine couldn't start. Try reloading the page.";
    if (chess.turn() !== playerCode || thinking) return "Wait for the engine's move.";
    const move = parseTypedMove(chess, text);
    if (!move) return `"${text.trim()}" isn't a legal move here.`;
    setPendingPromotion(null);
    goToLastMove();
    return playUserMove(move.from, move.to, move.promotion) ? null : "That move couldn't be played.";
  };

  /** The analysis's suggested move as an arrow on the board (UCI), or none */
  const showArrow = useCallback((uci: string | null) => {
    const cg = cgRef.current;
    if (!cg) return;
    cg.setAutoShapes(
      uci ? [{ orig: uci.slice(0, 2) as Key, dest: uci.slice(2, 4) as Key, brush: "paleBlue" }] : []
    );
  }, [cgRef]);

  const playerMoves = useMemo(() => countPlayerMoves(history, playerColor), [history, playerColor]);
  const positions = useMemo(
    () => [exercise.fen, ...history.map((move) => move.after)],
    [exercise.fen, history]
  );

  return {
    boardRef,
    history,
    positions,
    playerMoves,
    thinking,
    evaluation,
    /** Set once the attempt is over */
    result: evaluation.status === "playing" ? null : evaluation,
    attempt,
    engineError,
    pendingPromotion,
    selectPromotion,
    cancelPromotion,
    retry,
    submitTypedMove,
    navigation,
    orientation,
    flip,
    showArrow,
    /**
     * A conversion's latest engine score, from the engine's side (null
     * before its first search, and for other objectives)
     */
    engineScore,
    /** A conversion still going on whose lead has already dipped once (hasSlipped) */
    slipped: converting && evaluation.status === "playing" && hasSlipped(engineScore),
    isPlayerTurn:
      evaluation.status === "playing" && !thinking && chessRef.current.turn() === playerCode,
  };
};
