import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Chess } from "chess.js";
import type { Key } from "@lichess-org/chessground/types";
import { useBasePuzzleSession } from "../hooks/useBasePuzzleSession";
import { PUZZLE_CONFIG } from "../constants/puzzle.constants";
import { PuzzleContext, type EnteredMove, type PuzzleContextType } from "./PuzzleContext";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { useChessSound } from "@/features/game/contexts/ChessSoundContext";
import { parseTypedMove } from "@/features/game/utils/parseTypedMove";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { parsePersonalBest } from "../utils/rushRun";
import {
  appendMove,
  followLine,
  isLineComplete,
  judgeLine,
  lineToSan,
  playUci,
  playerMoveCount,
  type AppendRefusal,
} from "../utils/calculateLine";
import { calculateAttemptReducer, initialCalculateAttempt, isRunFinished } from "../utils/calculateAttempt";

const RULES = PUZZLE_CONFIG.CALCULATE;

const REFUSALS: Record<AppendRefusal, string> = {
  illegal: "That move isn't legal in the position your line has reached.",
  full: "That's the whole line. Submit it, or remove the last move.",
  over: "The game is over at that point in your line. Submit it, or remove the last move.",
};

const turnOf = (chess: Chess) => (chess.turn() === "w" ? "white" : "black");

/**
 * Calculate first: Survival's rules (three lives, no clock) on the puzzles
 * served with solutions, but the player enters the whole line, their moves
 * and the replies they expect, on a board that stays on the starting
 * position. A hidden position follows the line so illegal moves are refused;
 * nothing says whether a move is right until the line is submitted. Then:
 * every move of the player's right is a solve, a wrong one costs a life and
 * the solution plays out, and a reply predicted differently (after right
 * moves) costs nothing: the board plays up to the real reply and the player
 * enters the rest of the line from there, judged the same way. No move of
 * theirs is ever played before they have entered it as part of a line.
 */
export const CalculatePuzzleProvider = ({ children }: { children: ReactNode }) => {
  const [storedBest, setStoredBest] = useLocalStorage<number>(RULES.BEST_STORAGE_KEY, 0) as [
    unknown,
    (best: number) => void,
  ];
  const best = parsePersonalBest(storedBest);
  /** The best when this run started, to tell a new best apart */
  const [runStartBest, setRunStartBest] = useState(best);
  const [lives, setLives] = useState<number>(RULES.INITIAL_LIVES);
  const [history, setHistory] = useState<boolean[]>([]);
  const isGameOver = lives <= 0;
  const score = history.filter(Boolean).length;

  const { cgRef, setInputLocked } = useChessBoardContext();
  const { playSound, playGenericSound } = useChessSound();

  const [attemptState, dispatch] = useReducer(calculateAttemptReducer, null, initialCalculateAttempt);
  const [entryError, setEntryError] = useState<string | null>(null);

  // Declared before the session, so the first puzzle loads with the board
  // locked. Pieces never move on the board itself: lines are entered on the
  // overlay or typed, and only replays move them.
  useEffect(() => {
    setInputLocked(true);
    cgRef.current?.set({ movable: { color: undefined } });
  }, [setInputLocked, cgRef]);

  const onPuzzleSolved = useCallback(() => setHistory((prev) => [...prev, true]), []);
  const onPuzzleFailed = useCallback(() => {
    setHistory((prev) => [...prev, false]);
    setLives((prev) => Math.max(0, prev - 1));
  }, []);

  const session = useBasePuzzleSession({ onPuzzleSolved, onPuzzleFailed, isGameOver });
  const { puzzle, status, puzzleState, loadNextPuzzle, recordSolve, recordFail, baseRestart } = session;
  const { setStatus } = puzzleState;

  const loadNextRef = useRef(loadNextPuzzle);
  useEffect(() => {
    loadNextRef.current = loadNextPuzzle;
  }, [loadNextPuzzle]);

  // Replay timers, cleared whenever the puzzle changes
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

  const puzzleId = puzzle?.id ?? null;
  useEffect(() => {
    clearTimers();
    setEntryError(null);
    dispatch({ type: "reset", puzzleId });
  }, [puzzleId, clearTimers]);

  // Until the reset above has run, a new puzzle starts from an empty line
  const attempt = useMemo(
    () => (attemptState.puzzleId === puzzleId ? attemptState : initialCalculateAttempt(puzzleId)),
    [attemptState, puzzleId]
  );
  const { entered, fixed, phase, verdict, differed } = attempt;

  const followed = useMemo(() => (puzzle ? followLine(puzzle.fen, entered) : null), [puzzle, entered]);
  const position = followed?.chess ?? null;
  const enteredSan = useMemo(() => followed?.moves.map((m) => m.san) ?? [], [followed]);
  const solutionSan = useMemo(
    () => (puzzle && verdict ? lineToSan(puzzle.fen, puzzle.moves) : []),
    [puzzle, verdict]
  );
  /** The reply predicted differently, in SAN: what was played, and what the solver expected */
  const differedSan = useMemo(() => {
    if (!puzzle || !differed) return null;
    const predicted = lineToSan(puzzle.fen, [...entered.slice(0, differed.index), differed.predicted]);
    return { index: differed.index, real: enteredSan[differed.index] ?? "", predicted: predicted.at(-1) ?? "" };
  }, [puzzle, differed, entered, enteredSan]);
  const canSubmit =
    !!puzzle &&
    phase === "entering" &&
    !isGameOver &&
    entered.length > fixed &&
    isLineComplete(puzzle.fen, entered, puzzle.moves.length);

  /** Why a move can't go in, or null once it has */
  const tryAdd = useCallback(
    (move: EnteredMove): string | null => {
      if (!puzzle || phase !== "entering" || isGameOver) return "The line can't be changed now.";
      const added = appendMove(puzzle.fen, entered, puzzle.moves.length, move);
      if ("refused" in added) return REFUSALS[added.refused];
      dispatch({ type: "enter", line: added.line });
      setEntryError(null);
      playSound("move");
      return null;
    },
    [puzzle, phase, isGameOver, entered, playSound]
  );

  const addMove = useCallback(
    (move: EnteredMove) => {
      const problem = tryAdd(move);
      setEntryError(problem);
      return problem;
    },
    [tryAdd]
  );

  // The typed field shows its own error, so it doesn't go to entryError
  const addTypedMove = useCallback(
    (text: string) => {
      if (!puzzle || !position) return "The line can't be changed now.";
      if (entered.length >= puzzle.moves.length) return REFUSALS.full;
      if (position.isGameOver()) return REFUSALS.over;
      const parsed = parseTypedMove(position, text);
      if (!parsed) return `“${text.trim()}” isn't a legal move in the position your line has reached.`;
      return tryAdd(parsed);
    },
    [puzzle, position, entered, tryAdd]
  );

  const removeLast = useCallback(() => {
    setEntryError(null);
    dispatch({ type: "removeLast" });
  }, []);
  const clearLine = useCallback(() => {
    setEntryError(null);
    dispatch({ type: "clear" });
  }, []);

  /** Plays `line` out on the board from `fen`, then calls `done` with the position reached. */
  const playLine = useCallback(
    (fen: string, line: readonly string[], done: (chess: Chess) => void) => {
      clearTimers();
      let chess: Chess;
      try {
        chess = new Chess(fen);
      } catch {
        return;
      }
      cgRef.current?.setAutoShapes([]);
      cgRef.current?.set({
        fen,
        lastMove: undefined,
        turnColor: turnOf(chess),
        check: chess.inCheck(),
        movable: { color: undefined },
        drawable: { shapes: [] },
      });
      const step = (index: number) => {
        const move = index < line.length ? playUci(chess, line[index]) : null;
        if (!move) {
          done(chess);
          return;
        }
        // set() rather than move(): no move event, so the puzzle's own
        // move handler never sees the replay
        cgRef.current?.set({
          fen: chess.fen(),
          lastMove: [move.from as Key, move.to as Key],
          turnColor: turnOf(chess),
          check: chess.inCheck(),
        });
        playSound(move.captured ? "capture" : "move");
        schedule(() => step(index + 1), RULES.REPLAY_MOVE_MS);
      };
      schedule(() => step(0), RULES.REPLAY_MOVE_MS / 2);
    },
    [cgRef, clearTimers, schedule, playSound]
  );

  const submit = useCallback(() => {
    if (!puzzle || !canSubmit) return;
    // The whole line is judged, its fixed start being the solution's own
    const judged = judgeLine(puzzle.fen, puzzle.moves, entered);
    const solution = puzzle.moves;
    dispatch({ type: "submit", verdict: judged });
    setEntryError(null);
    // The board shows the position after the fixed start; replays go on from there
    const fromFen = followLine(puzzle.fen, entered.slice(0, fixed))?.chess.fen() ?? puzzle.fen;
    const replayed = () => dispatch({ type: "replayed", solution });

    if (judged.result === "solved") {
      recordSolve();
      setStatus("success");
      playLine(fromFen, entered.slice(fixed), () => {
        replayed();
        playGenericSound();
        schedule(() => void loadNextRef.current(), RULES.NEXT_AFTER_SOLVE_MS);
      });
      return;
    }

    if (judged.result === "failed") {
      recordFail();
      setStatus("failed");
      playGenericSound();
      playLine(fromFen, solution.slice(fixed), replayed);
      return;
    }

    // A reply differed: the line up to and including the real reply is
    // played, and the rest is entered from the position it leaves (no
    // penalty so far)
    playLine(fromFen, solution.slice(fixed, judged.index + 1), replayed);
  }, [puzzle, canSubmit, entered, fixed, recordSolve, recordFail, setStatus, playLine, playGenericSound, schedule]);

  useEffect(() => {
    if (isGameOver && score > best) setStoredBest(score);
  }, [isGameOver, score, best, setStoredBest]);

  const restart = useCallback(() => {
    setRunStartBest(Math.max(best, score));
    setLives(RULES.INITIAL_LIVES);
    setHistory([]);
    clearTimers();
    baseRestart();
  }, [best, score, clearTimers, baseRestart]);

  const noop = useCallback(() => {}, []);

  const value = useMemo<PuzzleContextType>(
    () => ({
      puzzle,
      status,
      isLoading: session.isLoading,
      onNextPuzzle: loadNextPuzzle,
      // No retries, hints or shown solutions: the line is judged once
      onRetry: noop,
      onHint: noop,
      onShowSolution: noop,
      sessionStats: session.sessionStats,
      wrongMove: session.wrongMove,
      revealed: session.revealed,
      feed: session.feed,
      mode: "calculate" as const,
      lives,
      history,
      isGameOver,
      best: Math.max(best, isGameOver ? score : 0),
      isNewBest: isGameOver && score > 0 && score > runStartBest,
      attempt,
      enteredSan,
      solutionSan,
      differed: differedSan,
      runFinished: isRunFinished(isGameOver, attempt),
      requiredMoves: puzzle ? playerMoveCount(puzzle.moves) : 0,
      position,
      canSubmit,
      entryError,
      addMove,
      addTypedMove,
      removeLast,
      clearLine,
      submit,
      isReplaying: phase === "replaying",
      restart,
    }),
    [
      puzzle,
      status,
      session.isLoading,
      session.sessionStats,
      session.wrongMove,
      session.revealed,
      session.feed,
      loadNextPuzzle,
      noop,
      lives,
      history,
      isGameOver,
      best,
      score,
      runStartBest,
      attempt,
      enteredSan,
      solutionSan,
      differedSan,
      position,
      canSubmit,
      entryError,
      addMove,
      addTypedMove,
      removeLast,
      clearLine,
      submit,
      phase,
      restart,
    ]
  );

  return <PuzzleContext.Provider value={value}>{children}</PuzzleContext.Provider>;
};
