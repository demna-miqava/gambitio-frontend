import { Loader2, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DrillScanState } from "../hooks/useDrillScan";

const resultText = (scanned: number, found: number): string => {
  if (scanned === 0) return "No new games to scan. Games you draw or lose are added as you play.";
  const games = `${scanned} ${scanned === 1 ? "game" : "games"}`;
  if (found === 0) return `Scanned ${games}: no clearly won positions slipped away. Nice.`;
  return `Scanned ${games} and found ${found} new ${found === 1 ? "drill" : "drills"}.`;
};

/**
 * Finds drills in the player's recent games: Stockfish runs in this tab, a
 * game at a time, and the scan can be stopped at any point.
 */
export const ScanPanel = ({
  state,
  onStart,
  onCancel,
}: {
  state: DrillScanState;
  onStart: () => void;
  onCancel: () => void;
}) => {
  const scanning = state.status === "scanning";
  return (
    <section
      aria-label="Scan your games"
      className="flex flex-col gap-3 rounded-2xl bg-card p-5 sm:flex-row sm:items-center sm:gap-6"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-primary">
        <ScanSearch className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 space-y-1" role="status" aria-live="polite">
        <p className="text-sm font-medium text-foreground">
          {scanning
            ? state.total === 0
              ? "Finding your games…"
              : `Scanning game ${Math.min(state.done + 1, state.total)} of ${state.total}…`
            : state.status === "done"
              ? resultText(state.scanned, state.found)
              : state.status === "error"
                ? "The scan stopped: Stockfish or the connection failed. Games already scanned are kept."
                : "Find the positions you let slip"}
        </p>
        <p className="text-sm text-muted-foreground">
          {scanning
            ? `${state.found} found so far. Stockfish is running in this tab; you can stop at any time.`
            : "Stockfish looks through your recent draws and losses for positions where you were clearly winning (+3 or more, for at least two moves)."}
        </p>
      </div>
      {scanning ? (
        <Button size="lg" variant="outline" onClick={onCancel}>
          <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Stop
        </Button>
      ) : (
        <Button size="lg" variant={state.status === "idle" ? "default" : "outline"} onClick={onStart}>
          Scan recent games
        </Button>
      )}
    </section>
  );
};
