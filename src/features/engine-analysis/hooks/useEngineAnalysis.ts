import { useEffect, useRef, useCallback } from "react";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { useStockfish } from "@/features/engine-analysis/hooks/useStockfish";
import { ANALYSIS_DEFAULTS } from "@/features/engine-analysis/constants";
import { useAnalysis } from "../contexts/EngineAnalysisContext";

interface UseEngineAnalysisOptions {
  numLines?: number;
  depth?: number;
  moveTime?: number;
  debounceMs?: number;
}

export function useEngineAnalysis({
  numLines = ANALYSIS_DEFAULTS.numLines,
  depth = ANALYSIS_DEFAULTS.depth,
  moveTime = ANALYSIS_DEFAULTS.moveTime,
  debounceMs = ANALYSIS_DEFAULTS.debounceMs,
}: UseEngineAnalysisOptions = {}) {
  const { chessRef } = useChessBoardContext();
  const { analysis, setAnalysis } = useAnalysis();
  const { isReady, isThinking, analyzeMultiPv, stop } = useStockfish({
    depth,
    moveTime,
  });

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const analyze = useCallback(
    async (fen: string, requestId: number) => {
      if (!isReady) return;
      try {
        const result = await analyzeMultiPv(fen, numLines);
        // Ignore stale responses
        if (requestId !== requestIdRef.current) return;

        if (result) {
          const bestLine = result.lines[0];
          setAnalysis({
            score: bestLine?.score ?? 0,
            mate: bestLine?.mate,
            lines: result.lines,
            depth: result.depth,
            isAnalyzing: false,
            fen,
          });
        }
      } catch {
        if (requestId === requestIdRef.current) {
          setAnalysis({ isAnalyzing: false });
        }
      }
    },
    [isReady, analyzeMultiPv, numLines, setAnalysis]
  );

  const debouncedAnalyze = useCallback(
    (fen: string) => {
      // Clear any pending debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      const requestId = ++requestIdRef.current;

      // Mark as analyzing (keep old lines until new ones arrive)
      setAnalysis({ isAnalyzing: true });

      debounceTimerRef.current = setTimeout(() => {
        stop();
        analyze(fen, requestId);
      }, debounceMs);
    },
    [analyze, stop, debounceMs, setAnalysis]
  );

  const FEN = chessRef.current?.fen();
  useEffect(() => {
    if (!isReady || !FEN) return;
    debouncedAnalyze(FEN);
  }, [isReady, FEN, debouncedAnalyze]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      // Invalidate any in-flight analysis on unmount
      requestIdRef.current += 1;
      stop();
    };
  }, [stop]);

  return {
    lines: analysis.lines,
    depth: analysis.depth,
    isReady,
    isAnalyzing: analysis.isAnalyzing || isThinking,
    analysisFen: analysis.fen,
  };
}
