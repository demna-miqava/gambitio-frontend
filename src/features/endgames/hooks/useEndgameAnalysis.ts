import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Chess } from "chess.js";
import { QKEY_ENDGAME_TABLEBASE } from "@/constants/queryKeys";
import { StockfishService } from "@/features/engine-analysis/services/stockfish";
import type { EvaluationLine } from "@/features/engine-analysis/types";
import { fetchTablebase, inTablebase } from "../services/tablebase";

/** Deep enough for long mating lines; these positions search fast. */
const ANALYSIS_DEPTH = 40;
const ANALYSIS_MOVE_TIME_MS = 2500;
/** Stepping through moves quickly only analyses where you stop */
const DEBOUNCE_MS = 250;

export interface EngineLine {
  fen: string;
  line: EvaluationLine;
  depth: number;
}

const isGameOver = (fen: string) => {
  try {
    return new Chess(fen).isGameOver();
  } catch {
    return true;
  }
};

/**
 * Analysis of one position while `enabled`: Stockfish's best line (its own
 * worker, started only while analysis is on) and, with seven pieces or
 * fewer, the tablebase's verdict. `paused` holds the engine back, so it
 * doesn't take CPU from the opponent while it thinks.
 */
export const useEndgameAnalysis = ({
  fen,
  enabled,
  paused,
}: {
  fen: string;
  enabled: boolean;
  paused: boolean;
}) => {
  const engineRef = useRef<StockfishService | null>(null);
  const [ready, setReady] = useState(false);
  const [engineError, setEngineError] = useState(false);
  const [result, setResult] = useState<EngineLine | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const requestRef = useRef(0);
  const over = isGameOver(fen);

  // The worker lives only while analysis is on
  useEffect(() => {
    if (!enabled) return;
    const engine = new StockfishService();
    engineRef.current = engine;
    setEngineError(false);
    engine
      .init({ depth: ANALYSIS_DEPTH, moveTime: ANALYSIS_MOVE_TIME_MS, multiPv: 1 })
      .then(() => {
        if (engineRef.current === engine) setReady(true);
      })
      .catch(() => {
        if (engineRef.current === engine) setEngineError(true);
      });
    return () => {
      requestRef.current += 1;
      engine.destroy();
      engineRef.current = null;
      setReady(false);
      setAnalyzing(false);
      setResult(null);
    };
  }, [enabled]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!enabled || !ready || !engine) return;
    const request = ++requestRef.current;
    if (paused || over) {
      engine.stop();
      setAnalyzing(false);
      return;
    }
    setAnalyzing(true);
    const timer = setTimeout(() => {
      engine
        .analyzeMultiPv(fen, 1)
        .then(({ lines, depth }) => {
          if (request !== requestRef.current) return;
          const line = lines[0];
          setResult(line ? { fen, line, depth } : null);
        })
        .catch(() => {
          if (request === requestRef.current) setEngineError(true);
        })
        .finally(() => {
          if (request === requestRef.current) setAnalyzing(false);
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [enabled, ready, paused, over, fen]);

  const tablebaseQuery = useQuery({
    queryKey: [QKEY_ENDGAME_TABLEBASE, fen],
    queryFn: ({ signal }) => fetchTablebase(fen, signal),
    enabled: enabled && !over && inTablebase(fen),
    staleTime: Infinity,
    gcTime: 30 * 60_000,
    retry: 1,
  });

  return {
    /** Stockfish's line for this position, once it has one */
    engineLine: result?.fen === fen ? result : null,
    engineReady: ready,
    analyzing,
    engineError,
    gameOver: over,
    hasTablebase: inTablebase(fen),
    tablebase: tablebaseQuery.data ?? null,
    tablebaseLoading: tablebaseQuery.isFetching,
    tablebaseError: tablebaseQuery.isError,
  };
};
