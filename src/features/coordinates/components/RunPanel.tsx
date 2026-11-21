import { forwardRef } from "react";
import { Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatClock } from "../utils/coordinates";
import type { RunState } from "../utils/runReducer";

const Stat = ({ label, value, className }: { label: string; value: number; className?: string }) => (
  <div className="flex h-16 flex-col justify-center rounded-xl bg-muted/60 px-3">
    <span className="text-xs font-medium text-muted-foreground">{label}</span>
    <span className={cn("text-2xl font-medium tabular-nums text-foreground", className)}>{value}</span>
  </div>
);

/**
 * A run in progress: the target (also over the board), the next square,
 * the clock, the score and misses, and Stop. Screen readers hear each new
 * target, and a miss, from the live region.
 */
export const RunPanel = forwardRef<HTMLDivElement, { run: RunState; timeLeftMs: number; onStop: () => void }>(
  ({ run, timeLeftMs, onStop }, ref) => {
    const lastMiss = run.feedback?.kind === "wrong";
    const announcement = lastMiss ? `Miss. Still ${run.target}` : `Find ${run.target}`;
    return (
      <div ref={ref} tabIndex={-1} className="space-y-3 outline-none">
        <div className="flex items-end justify-between gap-3 rounded-xl bg-muted/60 px-4 py-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Find</p>
            <p className="font-display-num text-6xl leading-none text-foreground" aria-hidden="true">
              {run.target}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-muted-foreground">Next</p>
            <p className="font-display-num text-2xl leading-none text-muted-foreground" aria-hidden="true">
              {run.next}
            </p>
          </div>
        </div>
        {/* Changes text with every target and every miss, so each is read out */}
        <p className="sr-only" role="status" aria-live="assertive" aria-atomic="true">
          {/* The id makes a second miss on the same target a new announcement */}
          <span key={run.feedback?.id ?? 0}>{announcement}</span>
        </p>

        <div className="flex h-12 items-center justify-between rounded-xl bg-muted/60 px-3">
          <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Clock className="size-5" aria-hidden="true" />
            {run.phase === "ready" ? "Starts with your first click" : "Time left"}
          </span>
          <span
            role="timer"
            aria-label="Time left"
            className={cn(
              "text-2xl font-medium tabular-nums",
              run.phase === "running" && timeLeftMs < 10_000 ? "text-loss" : "text-foreground"
            )}
          >
            {formatClock(timeLeftMs)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Found" value={run.score} />
          <Stat label="Misses" value={run.misses} className={run.misses > 0 ? "text-loss" : undefined} />
        </div>

        <Button variant="outline" className="w-full" onClick={onStop} aria-keyshortcuts="Escape">
          <X aria-hidden="true" /> Stop
          <kbd className="ml-1 hidden rounded border border-current/30 px-1 text-[0.65rem] font-normal opacity-70 sm:inline">
            Esc
          </kbd>
        </Button>
      </div>
    );
  }
);
RunPanel.displayName = "RunPanel";
