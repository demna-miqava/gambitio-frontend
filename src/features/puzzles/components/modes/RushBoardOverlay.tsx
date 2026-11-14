import { useEffect, useRef } from "react";
import { Loader2, Play, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRushMode } from "../../contexts";
import { PUZZLE_CONFIG } from "../../constants/puzzle.constants";

const MINUTES = PUZZLE_CONFIG.RUSH.DURATION_SECONDS / 60;

/**
 * Covers the board before a run: the start gate, then the 3-2-1 countdown.
 * The position stays hidden until the clock starts.
 */
export const RushBoardOverlay = () => {
  const { phase, countdown, start, puzzle, feed, maxStrikes } = useRushMode();
  const countdownRef = useRef<HTMLDivElement>(null);
  // Start unmounts with the gate; keep keyboard focus in the overlay instead
  // of letting it fall back to the page
  useEffect(() => {
    if (phase === "countdown") countdownRef.current?.focus();
  }, [phase]);
  if (phase !== "ready" && phase !== "countdown") return null;

  let startLabel = "Loading puzzles…";
  if (feed.isError) startLabel = "Couldn't load puzzles";
  else if (feed.isEmpty) startLabel = "No puzzles available";

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-background/85 p-6 text-center backdrop-blur-sm">
      {phase === "ready" ? (
        <>
          <Zap className="size-9 text-blitz" aria-hidden="true" />
          <div className="space-y-1.5">
            <h2 className="font-display text-2xl text-foreground">Ready?</h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              {`${MINUTES} minutes, ${maxStrikes} strikes. The clock starts after a 3-second countdown.`}
            </p>
          </div>
          <Button size="lg" onClick={start} disabled={!puzzle} className="min-w-36">
            {puzzle ? (
              <>
                <Play aria-hidden="true" />
                Start
              </>
            ) : (
              <>
                {!feed.isError && !feed.isEmpty && (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                )}
                {startLabel}
              </>
            )}
          </Button>
        </>
      ) : (
        <div
          ref={countdownRef}
          tabIndex={-1}
          role="status"
          aria-live="assertive"
          className="flex flex-col items-center gap-2 outline-none"
        >
          <span className="text-sm font-medium text-muted-foreground">Get ready</span>
          <span
            key={countdown}
            className="font-display-num text-8xl text-foreground animate-in fade-in zoom-in-75 duration-300 motion-reduce:animate-none"
          >
            {countdown}
          </span>
        </div>
      )}
    </div>
  );
};
