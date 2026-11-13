import type { SessionStats } from "../../types/puzzle.types";

/** This session's tally: one compact row of three numbers. */
export const PuzzleSessionStats = ({ stats }: { stats: SessionStats }) => {
  const items = [
    { label: "Solved", value: stats.solved, className: "text-success" },
    { label: "Failed", value: stats.failed, className: "text-loss" },
    { label: "Streak", value: stats.streak, className: "text-foreground" },
  ];

  return (
    <section
      aria-labelledby="puzzle-session-heading"
      className="rounded-xl border border-border/70 bg-card px-3 py-2.5"
    >
      <h2 id="puzzle-session-heading" className="mb-1.5 text-xs font-medium text-muted-foreground">
        This session
      </h2>
      <dl className="grid grid-cols-3 gap-2">
        {items.map(({ label, value, className }) => (
          <div key={label} className="flex flex-col-reverse">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className={`text-xl font-semibold tabular-nums ${className}`}>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
