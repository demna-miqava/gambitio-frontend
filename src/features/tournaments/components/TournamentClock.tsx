import { cn } from "@/lib/utils";
import { useNow } from "../hooks/useNow";
import type { Tournament } from "../types";
import { formatCountdown, tournamentPhase } from "../utils/tournamentFormat";

interface TournamentClockProps {
  tournament: Pick<Tournament, "status" | "startsAt" | "endsAt"> & Partial<Pick<Tournament, "winner">>;
  /** One line ("Starts in 4:05") for lists; the lobby shows the label above a large clock */
  compact?: boolean;
  className?: string;
}

const LABELS = {
  upcoming: "Starts in",
  starting: "Waiting for players",
  running: "Time left",
  closing: "Last games",
  finished: "Finished",
  cancelled: "Cancelled",
} as const;

/** Where a tournament is: a countdown to its start or its end, or that it is over. */
export const TournamentClock = ({ tournament, compact = false, className }: TournamentClockProps) => {
  const open = tournament.status === "scheduled" || tournament.status === "running";
  const now = useNow(1_000, open);
  const phase = tournamentPhase(tournament, now);
  const label = LABELS[phase.kind];
  const time = "msLeft" in phase ? formatCountdown(phase.msLeft) : null;

  if (compact) {
    return (
      <span className={cn("tabular-nums", className)}>
        {label}
        {time && <> {time}</>}
      </span>
    );
  }
  if (time) {
    return (
      <div className={cn("leading-tight", className)}>
        <p className="text-xs text-muted-foreground">{label}</p>
        {/* A timer: not read out every second */}
        <p role="timer" aria-live="off" className="font-display-num text-3xl text-foreground">
          {time}
        </p>
      </div>
    );
  }
  // No clock to show: what it is waiting for, or how it ended
  const [caption, value] =
    phase.kind === "starting"
      ? [label, "Any moment"]
      : phase.kind === "closing"
        ? [label, "Finishing"]
        : phase.kind === "cancelled"
          ? ["Tournament", "Cancelled"]
          : tournament.winner
            ? ["Winner", tournament.winner.username]
            : ["Tournament", "Finished"];
  return (
    <div className={cn("min-w-0 leading-tight", className)}>
      <p className="text-xs text-muted-foreground">{caption}</p>
      <p className="truncate font-display text-xl text-foreground">{value}</p>
    </div>
  );
};
