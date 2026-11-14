import { ResultsBar } from "../ResultsBar";
import type { ComprehensiveStatsData } from "../../hooks/useGetComprehensiveStats";

/** Results in the period plus three highlights. */
const ResultsBreakdown = ({ statsData }: { statsData: ComprehensiveStatsData }) => {
  const { totalGames, wins, draws, losses, averageRating, bestWin, winStreak } = statsData;
  const highlights = [
    { label: "Average opponent", value: averageRating ? averageRating.toLocaleString() : "–" },
    { label: "Best win", value: bestWin ? bestWin.toLocaleString() : "–", hint: "opponent's rating" },
    {
      label: "Longest win streak",
      value: winStreak ? `${winStreak} ${winStreak === 1 ? "game" : "games"}` : "–",
    },
  ];

  return (
    <section
      aria-labelledby="results-title"
      className="space-y-5 rounded-2xl bg-card p-5 sm:p-6"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 id="results-title" className="text-lg font-display text-foreground">
          Results
        </h3>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium tabular-nums text-foreground">
            {totalGames.toLocaleString()}
          </span>{" "}
          {totalGames === 1 ? "game" : "games"}
        </p>
      </div>

      <ResultsBar wins={wins} draws={draws} losses={losses} />

      <dl className="grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
        {highlights.map(({ label, value, hint }) => (
          <div key={label} className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">
              {label}
              {hint && <span className="sr-only"> ({hint})</span>}
            </dt>
            <dd className="text-lg font-medium tabular-nums text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

export default ResultsBreakdown;
