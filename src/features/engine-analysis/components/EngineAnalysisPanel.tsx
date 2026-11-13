import { Loader2 } from "lucide-react";
import { useEngineAnalysis } from "../hooks/useEngineAnalysis";
import { AnalysisLineItem } from "./AnalysisLineItem";
import { useMemo, type ReactNode } from "react";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { cn } from "@/lib/utils";

interface EngineAnalysisPanelProps {
  numLines?: number;
  /** Position to analyze (pass it explicitly so analysis never lags a move behind) */
  fen?: string;
  /** Called with a line's first move (UCI) when the line is clicked */
  onPlayMove?: (uci: string) => void;
  /** Hide the "Engine Analysis / Depth" row below the lg breakpoint */
  compactOnMobile?: boolean;
  /**
   * From lg: show only this many of the lines (the engine still computes
   * `numLines`, so expanding is instant). Phones always show every line.
   */
  desktopVisibleLines?: number;
  /** From lg: a control placed beside the first line (e.g. expand / collapse) */
  desktopToggle?: ReactNode;
  /** Hide the "Engine Analysis / Depth" row from lg */
  hideDesktopHeader?: boolean;
  /** id of the lines' container (for aria-controls) */
  id?: string;
}

export const EngineAnalysisPanel = ({
  numLines = 3,
  fen,
  onPlayMove,
  compactOnMobile = false,
  desktopVisibleLines,
  desktopToggle,
  hideDesktopHeader = false,
  id,
}: EngineAnalysisPanelProps) => {
  const { lines, depth, isReady, isAnalyzing, analysisFen } = useEngineAnalysis({
    numLines,
    ...(fen && { fen }),
  });
  const { color } = useChessBoardContext();
  // Only update displayData when analysisFen changes (new analysis arrives)
  // This keeps showing old lines until new analysis is ready
  const displayData = useMemo(() => {
    return { lines, fen: analysisFen };
  }, [analysisFen, lines]);

  // Always reserve one row per requested line (same height as a real line),
  // so the panel never changes height while you step through moves
  const placeholder = (key: number, label?: string) => (
    <div
      key={`empty-${key}`}
      aria-hidden={!label}
      className="flex h-[38px] items-center gap-2 rounded-md border border-border/50 bg-muted/30 px-3 text-sm text-muted-foreground pointer-coarse:h-11 lg:px-4"
    >
      {label}
    </div>
  );

  const rows =
    !isReady || displayData.lines.length === 0
      ? [
          placeholder(
            0,
            !isReady ? "Loading engine…" : isAnalyzing ? "Analyzing…" : "No moves to analyze"
          ),
          ...Array.from({ length: numLines - 1 }, (_, i) => placeholder(i + 1)),
        ]
      : [
          ...displayData.lines.slice(0, numLines).map((line) => (
            <AnalysisLineItem
              key={line.multipv}
              line={line}
              fen={displayData.fen}
              playerColor={color}
              // Lines for an older position can't be played from this one
              {...(onPlayMove && displayData.fen === fen && line.pv[0]
                ? { onPlay: () => onPlayMove(line.pv[0]!) }
                : {})}
            />
          )),
          ...Array.from({ length: Math.max(0, numLines - displayData.lines.length) }, (_, i) =>
            placeholder(i + 10)
          ),
        ];

  return (
    <div className="space-y-1.5 lg:space-y-2">
      <div
        className={cn(
          "flex items-center justify-between text-xs text-muted-foreground",
          compactOnMobile && "hidden lg:flex",
          hideDesktopHeader && "lg:hidden"
        )}
      >
        <span>Engine analysis</span>
        <span className="flex items-center gap-1 tabular-nums">
          <Loader2
            className={cn("size-3 animate-spin", !(isAnalyzing || !isReady) && "invisible")}
            aria-hidden="true"
          />
          Depth {depth}
        </span>
      </div>

      {/* gap, not space-y: lines hidden on desktop leave no margin behind */}
      <div id={id} className="flex flex-col gap-1.5">
        {rows.map((row, i) => {
          const hiddenOnDesktop = desktopVisibleLines !== undefined && i >= desktopVisibleLines;
          if (i === 0 && desktopToggle) {
            return (
              <div key={row.key ?? i} className="flex items-center gap-1.5">
                <div className="min-w-0 flex-1">{row}</div>
                <div className="hidden shrink-0 lg:flex">{desktopToggle}</div>
              </div>
            );
          }
          return (
            <div
              key={row.key ?? i}
              className={cn(desktopToggle && "lg:flex lg:items-center lg:gap-1.5", hiddenOnDesktop && "lg:hidden")}
            >
              <div className="min-w-0 lg:flex-1">{row}</div>
              {/* Keeps the lines' right edges level with the first one */}
              {desktopToggle && <div className="hidden w-8 shrink-0 lg:block" aria-hidden="true" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};
