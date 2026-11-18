import { cn } from "@/lib/utils";
import { useNow } from "@/features/tournaments/hooks/useNow";
import { formatCountdown } from "@/features/tournaments/utils/tournamentFormat";
import type { SeriesSummary } from "../types";
import { matchPhase } from "../utils/seriesFormat";

/**
 * A timed match's countdown: "12:34 left", "Last game · 0:42", or "Time's
 * up" while the last game is played out. Nothing for a best-of series or a
 * finished match.
 */
export const MatchClock = ({
  series,
  size = "sm",
  className,
}: {
  series: SeriesSummary;
  /** "lg": a big clock with a caption (the series page) */
  size?: "sm" | "lg";
  className?: string;
}) => {
  const active = series.status === "active" && !!series.endsAt;
  const now = useNow(1_000, active);
  if (!active) return null;
  const phase = matchPhase(series, now);
  const time = phase.kind === "over" ? null : formatCountdown(phase.msLeft);
  const caption =
    phase.kind === "running" ? "Time left" : phase.kind === "last-game" ? "Last game" : "Time's up";

  if (size === "lg") {
    return (
      <div className={cn("text-center leading-tight", className)}>
        <p className="text-xs text-muted-foreground">{caption}</p>
        {/* A timer: not read out every second */}
        <p role="timer" aria-live="off" className="font-display-num text-3xl text-foreground">
          {time ?? "Finishing"}
        </p>
      </div>
    );
  }
  return (
    <span role="timer" aria-live="off" className={cn("tabular-nums", className)}>
      {phase.kind === "running" ? `${time} left` : phase.kind === "last-game" ? `Last game · ${time}` : caption}
    </span>
  );
};
