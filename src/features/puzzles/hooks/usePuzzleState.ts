import { useState, useRef } from "react";
import type { Puzzle, PuzzleStatus, SessionStats, WrongMove } from "../types/puzzle.types";
import type { PlayerColor } from "@/features/game/types/game.types";
import { EMPTY_SESSION_STATS } from "../utils/sessionStats";

export const usePuzzleState = () => {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [status, setStatus] = useState<PuzzleStatus>("solving");
  const [isLoading, setIsLoading] = useState(false);
  const [moveIndex, setMoveIndex] = useState(0);
  /** Last wrong move on the current attempt */
  const [wrongMove, setWrongMove] = useState<WrongMove | null>(null);
  /** The solution was played out by Solution, not solved by the player */
  const [revealed, setRevealed] = useState(false);

  const [sessionStats, setSessionStats] = useState<SessionStats>(EMPTY_SESSION_STATS);

  const userColor = useRef<PlayerColor>("white");
  const isSystemMove = useRef(false);

  return {
    puzzle,
    setPuzzle,
    status,
    setStatus,
    isLoading,
    setIsLoading,
    moveIndex,
    setMoveIndex,
    wrongMove,
    setWrongMove,
    revealed,
    setRevealed,
    sessionStats,
    setSessionStats,
    userColor,
    isSystemMove,
  };
};
