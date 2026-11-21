import { useCallback, useEffect, useRef } from "react";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { useChessSound } from "@/features/game/contexts/ChessSoundContext";
import { calculateLegalMoves } from "@/features/game/utils/board-utils";
import type { usePuzzleState } from "./usePuzzleState";
import type { Puzzle, PuzzleCheckResult } from "../types/puzzle.types";
import type { Key } from "@lichess-org/chessground/types";
import type { Chess, Move } from "chess.js";
import { wrongMoveShapes } from "../utils/wrongMoveMark";
import { toast } from "sonner";
import { PUZZLE_MESSAGES } from "../constants/puzzle.constants";

/** chess.js v1 throws on illegal moves; return null instead. */
const tryMove = (chess: Chess, uci: string): Move | null => {
  try {
    return chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      ...(uci[4] ? { promotion: uci[4] } : {}),
    });
  } catch {
    return null;
  }
};

/**
 * Chessground's own move only carries the piece across (castling included):
 * a promotion or an en passant capture needs the position from chess.js.
 */
const needsFenSync = (move: Move) => !!move.promotion || move.flags.includes("e");

const REPLY_DELAY_MS = 500;

/**
 * Rated mode: the solution is on the server. Each move of a hidden puzzle is
 * sent with the ones before it, and the answer says what happens next.
 */
export interface PuzzleVerifier {
  check: (puzzleId: string, userMoves: string[]) => Promise<PuzzleCheckResult>;
  /** Called with every answer that ends the puzzle, before onSolve / onFail */
  onOutcome: (puzzleId: string, result: PuzzleCheckResult) => void;
}

interface UsePuzzleGameProps {
  puzzleState: ReturnType<typeof usePuzzleState>;
  onSolve: () => void;
  onFail: () => void;
  verifier?: PuzzleVerifier;
}

/** The player's own moves in a line (they move first, so the even indexes). */
const isPuzzle = (value: unknown): value is Puzzle =>
  typeof value === "object" && value !== null && "moves" in value && "fen" in value;

const playerMoves = (line: string[], upTo: number) => line.slice(0, upTo).filter((_, i) => i % 2 === 0);

export const usePuzzleGame = ({
  puzzleState,
  onSolve,
  onFail,
  verifier,
}: UsePuzzleGameProps) => {
  const {
    puzzle,
    setPuzzle,
    status,
    setStatus,
    moveIndex,
    setMoveIndex,
    userColor,
    isSystemMove,
    setWrongMove,
    setRevealed,
  } = puzzleState;

  // The puzzle on the board right now, for answers that arrive later
  const puzzleRef = useRef(puzzle);
  puzzleRef.current = puzzle;
  const currentPuzzle = puzzle;

  // inputLockedRef: Rush keeps the board locked outside a running clock
  const { chessRef, cgRef, inputLockedRef, setOrientation } = useChessBoardContext();
  const { playSound } = useChessSound();

  // Pending reply/solution timers. Cleared when the board resets so a reply
  // scheduled for one puzzle can never land on the next one.
  const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>());
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current.clear();
  }, []);
  const schedule = useCallback((fn: () => void, ms: number) => {
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      fn();
    }, ms);
    timersRef.current.add(timer);
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  // Bumped whenever the board starts over (new puzzle, retry, solution), so
  // a server answer for an earlier attempt at the same puzzle is dropped
  const boardRunRef = useRef(0);

  // The puzzle the board was last turned to the solver's side for
  const orientedPuzzleRef = useRef<Puzzle["id"] | null>(null);
  const resetBoard = useCallback(
    (newPuzzle: Puzzle | null) => {
      if (!newPuzzle) return;
      clearTimers();
      boardRunRef.current += 1;

      const chess = chessRef.current;

      // Validate FEN before loading
      try {
        chess.load(newPuzzle.fen);
      } catch (error) {
        console.error("Invalid FEN:", newPuzzle.fen, error);
        return;
      }

      const playerColor = chess.turn() === "w" ? "white" : "black";
      userColor.current = playerColor;
      isSystemMove.current = false;
      setWrongMove(null);
      setRevealed(false);

      if (cgRef.current) {
        cgRef.current.setAutoShapes([]);
        // A new puzzle starts from the solver's side, even after a flip; a
        // retry of the same one keeps the view
        if (orientedPuzzleRef.current !== newPuzzle.id) {
          orientedPuzzleRef.current = newPuzzle.id;
          setOrientation(playerColor);
        }
        cgRef.current.set({
          fen: newPuzzle.fen,
          turnColor: playerColor,
          lastMove: undefined,
          check: chess.inCheck(),
          movable: {
            color: inputLockedRef.current ? undefined : playerColor,
            dests: calculateLegalMoves(chess),
          },
        });
      }
    },
    [chessRef, cgRef, inputLockedRef, setOrientation, userColor, isSystemMove, clearTimers, setWrongMove, setRevealed]
  );

  const playOpponentMove = useCallback(
    (nextIndex: number, line: string[]) => {
      if (!cgRef.current) return;

      // Bounds check - ensure move exists
      if (nextIndex >= line.length) {
        console.error("Move index out of bounds:", nextIndex, line.length);
        return;
      }

      const api = cgRef.current;
      const chess = chessRef.current;

      schedule(() => {
        const replyUCI = line[nextIndex];
        if (!replyUCI || replyUCI.length < 4) {
          console.error("Invalid UCI move:", replyUCI);
          return;
        }

        const from = replyUCI.slice(0, 2);
        const to = replyUCI.slice(2, 4);

        const replyMove = tryMove(chess, replyUCI);
        if (!replyMove) {
          console.error("Failed to execute move:", replyUCI);
          return;
        }

        isSystemMove.current = true;
        api.move(from as Key, to as Key);

        const currentTurn = chess.turn() === "w" ? "white" : "black";

        api.set({
          ...(needsFenSync(replyMove) ? { fen: chess.fen() } : {}),
          turnColor: currentTurn,
          movable: {
            dests: calculateLegalMoves(chess),
            color: inputLockedRef.current ? undefined : currentTurn,
          },
          check: chess.inCheck(),
        });

        if (replyMove.captured) playSound("capture");
        else playSound("move");

        setMoveIndex(nextIndex + 1);
      }, REPLY_DELAY_MS);
    },
    [cgRef, chessRef, inputLockedRef, isSystemMove, playSound, setMoveIndex, schedule]
  );

  const handleMoveFailure = useCallback(
    (move: Move) => {
      if (!cgRef.current) return;

      // The panel's live region announces it; the board marks the square
      setStatus("failed");
      setWrongMove({ from: move.from, to: move.to, san: move.san });

      cgRef.current.set({ movable: { color: undefined } });
      cgRef.current.setAutoShapes(wrongMoveShapes(move.to as Key));

      onFail();
    },
    [cgRef, setStatus, setWrongMove, onFail]
  );

  const handleMoveSuccess = useCallback(
    (move: Move, line: string[]) => {
      if (!cgRef.current) return;

      if (move.captured) playSound("capture");
      else playSound("move");

      const nextIndex = moveIndex + 1;
      setMoveIndex(nextIndex);

      // Any checkmate solves the puzzle, even an alternative to the listed line
      if (nextIndex >= line.length || chessRef.current.isCheckmate()) {
        setStatus("success");
        cgRef.current.set({ movable: { color: undefined } });
        onSolve();
        return;
      }

      playOpponentMove(nextIndex, line);
    },
    [
      cgRef,
      chessRef,
      moveIndex,
      playSound,
      setMoveIndex,
      setStatus,
      playOpponentMove,
      onSolve,
    ]
  );

  /** Draws the next move of the solution. `current`: a puzzle just revealed, before state catches up. */
  const onHint = useCallback((override?: Puzzle) => {
    // Also used as a click handler, which passes an event
    const current = isPuzzle(override) ? override : puzzle;
    if (!current || !cgRef.current) return;

    const nextMoveUCI = current.moves[moveIndex];
    if (!nextMoveUCI) return;

    const from = nextMoveUCI.slice(0, 2);
    const to = nextMoveUCI.slice(2, 4);

    cgRef.current.set({
      drawable: {
        shapes: [
          {
            orig: from as Key,
            dest: to as Key,
            brush: "green",
          },
        ],
      },
    });
  }, [puzzle, moveIndex, cgRef]);

  /**
   * A hidden puzzle's move, already on the board: the board stays locked
   * until the server says whether it was right. The server's line can
   * differ from what was played only in the promotion piece (the board
   * promotes to a queen; the line says what the solution promotes to).
   */
  const verifyMove = useCallback(
    (move: Move, uciMove: string) => {
      if (!puzzle || !verifier || !cgRef.current) return;
      const api = cgRef.current;
      const chess = chessRef.current;
      const asked = puzzle;
      const run = boardRunRef.current;
      // Moved on to another puzzle, or started this one over, meanwhile
      const stale = () => puzzleRef.current?.id !== asked.id || boardRunRef.current !== run;
      api.set({ movable: { color: undefined } });

      verifier
        .check(asked.id, [...playerMoves(asked.moves, moveIndex), uciMove])
        .then((result) => {
          if (stale()) return;
          const played = result.line[moveIndex];
          let shown = move;
          // Only the promotion piece is swapped: an alternative mate the
          // server accepted stays on the board as played
          if (
            result.result !== "failed" &&
            played &&
            played !== uciMove &&
            played.slice(0, 4) === uciMove.slice(0, 4)
          ) {
            chess.undo();
            const fixed = tryMove(chess, played);
            if (fixed) {
              shown = fixed;
              api.set({ fen: chess.fen(), lastMove: [fixed.from as Key, fixed.to as Key] });
            }
          }
          const updated: Puzzle = { ...asked, moves: result.line, hidden: result.result === "continue" };
          puzzleRef.current = updated;
          setPuzzle(updated);
          if (result.result !== "continue") verifier.onOutcome(asked.id, result);
          if (result.result === "failed") handleMoveFailure(shown);
          else handleMoveSuccess(shown, result.line);
        })
        .catch((error) => {
          console.error("Failed to check puzzle move", error);
          if (stale()) return;
          // Take the move back so it can be played again
          chess.undo();
          const turn = chess.turn() === "w" ? "white" : "black";
          api.set({
            fen: chess.fen(),
            turnColor: turn,
            movable: { color: inputLockedRef.current ? undefined : turn, dests: calculateLegalMoves(chess) },
          });
          toast.error(PUZZLE_MESSAGES.ATTEMPT_ERROR);
        });
    },
    [puzzle, verifier, cgRef, chessRef, moveIndex, setPuzzle, handleMoveFailure, handleMoveSuccess, inputLockedRef]
  );

  // Handle user move
  useEffect(() => {
    if (!cgRef.current || !puzzle || status !== "solving") return;

    const api = cgRef.current;

    api.set({
      events: {
        move: (orig, dest) => {
          if (isSystemMove.current) {
            isSystemMove.current = false;
            return;
          }

          const chess = chessRef.current;
          const expectedMove = puzzle.moves[moveIndex] ?? "";
          // Promote to the piece the solution expects (it may be an
          // underpromotion); otherwise default to a queen
          const promotion =
            expectedMove.slice(0, 4) === orig + dest && expectedMove[4]
              ? expectedMove[4]
              : "q";
          const piece = chess.get(orig as Parameters<Chess["get"]>[0]);
          const isPromotion =
            piece?.type === "p" && (dest[1] === "8" || dest[1] === "1");
          const move = tryMove(chess, orig + dest + (isPromotion ? promotion : ""));

          if (!move) return;
          if (needsFenSync(move)) api.set({ fen: chess.fen() });

          const uciMove =
            move.from + move.to + (move.promotion ? move.promotion : "");

          if (puzzle.hidden && verifier) {
            verifyMove(move, uciMove);
            return;
          }

          // Lichess convention: any mating move is accepted
          const isCorrect = uciMove === expectedMove || chess.isCheckmate();

          if (isCorrect) {
            handleMoveSuccess(move, puzzle.moves);
          } else {
            handleMoveFailure(move);
          }
        },
      },
    });
  }, [
    puzzle,
    status,
    moveIndex,
    cgRef,
    isSystemMove,
    chessRef,
    handleMoveSuccess,
    handleMoveFailure,
    verifier,
    verifyMove,
  ]);

  /** Plays out the solution. `current`: a puzzle just revealed, before state catches up. */
  const showSolution = useCallback((override?: Puzzle) => {
    const puzzle = isPuzzle(override) ? override : currentPuzzle;
    if (!puzzle || !cgRef.current) return;

    const chess = chessRef.current;
    const api = cgRef.current;
    clearTimers();
    boardRunRef.current += 1;

    // Reset board to initial puzzle position
    try {
      chess.load(puzzle.fen);
    } catch (error) {
      console.error("Invalid FEN:", puzzle.fen, error);
      return;
    }

    const playerColor = chess.turn() === "w" ? "white" : "black";

    api.setAutoShapes([]);
    setWrongMove(null);
    setRevealed(true);
    api.set({
      fen: puzzle.fen,
      turnColor: playerColor,
      lastMove: undefined,
      check: chess.inCheck(),
      movable: { color: undefined },
    });

    setMoveIndex(0);
    setStatus("solving");

    const playMove = (index: number) => {
      if (index >= puzzle.moves.length) {
        setStatus("success");
        return;
      }

      const moveUCI = puzzle.moves[index];
      if (!moveUCI || moveUCI.length < 4) return;

      const from = moveUCI.slice(0, 2);
      const to = moveUCI.slice(2, 4);

      const moveResult = tryMove(chess, moveUCI);
      if (!moveResult) return;

      isSystemMove.current = true;
      api.move(from as Key, to as Key);

      const turnColor = chess.turn() === "w" ? "white" : "black";
      api.set({
        ...(needsFenSync(moveResult) ? { fen: chess.fen() } : {}),
        turnColor,
        check: chess.inCheck(),
      });

      if (moveResult.captured) playSound("capture");
      else playSound("move");

      schedule(() => playMove(index + 1), REPLY_DELAY_MS);
    };

    playMove(0);
  }, [
    currentPuzzle,
    cgRef,
    chessRef,
    setStatus,
    setMoveIndex,
    setWrongMove,
    setRevealed,
    playSound,
    isSystemMove,
    clearTimers,
    schedule,
  ]);

  return {
    resetBoard,
    onHint,
    showSolution,
  };
};
