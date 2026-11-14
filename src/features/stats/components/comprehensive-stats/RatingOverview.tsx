import RatingDelta from "../RatingDelta";

interface RatingOverviewProps {
  /** "all" shows the average of the three ratings */
  variant: string;
  currentRating: number;
  ratingGain: number;
  highestRating: number;
  globalRank: number;
  percentile: number;
  friendsRank: number;
  friendsCount: number;
  /**
   * No rated game in this time control ever: the number is the starting
   * rating, so there's no best rating or rank to show yet
   */
  unrated?: boolean;
}

/** The rating for the selected variant and where it stands. */
const RatingOverview = ({
  variant,
  currentRating,
  ratingGain,
  highestRating,
  globalRank,
  percentile,
  friendsRank,
  friendsCount,
  unrated = false,
}: RatingOverviewProps) => {
  const ranks = [
    { label: "Global rank", value: `#${globalRank.toLocaleString()}` },
    // Nobody rated below you (e.g. a new account at the starting rating):
    // "Top 100%" says nothing, so leave it out
    ...(percentile > 0
      ? [{ label: "Percentile", value: `Top ${Math.max(1, 100 - percentile)}%` }]
      : []),
    ...(friendsCount > 0
      ? [
          {
            label: "Among friends",
            // Friends plus you
            value: `#${friendsRank} of ${friendsCount + 1}`,
          },
        ]
      : []),
  ];

  return (
    <section
      aria-label="Rating"
      className="flex flex-col gap-6 rounded-2xl bg-card p-5 sm:p-6 md:flex-row md:items-end md:justify-between"
    >
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          {unrated ? "Starting rating" : variant === "all" ? "Average rating" : "Rating"}
        </p>
        <div className="flex items-baseline gap-3">
          <span className="font-display-num text-5xl text-foreground">
            {currentRating.toLocaleString()}
          </span>
          <RatingDelta delta={ratingGain} className="text-sm font-medium" />
        </div>
        {unrated ? (
          <p className="text-sm text-muted-foreground">No rated games yet, so no rank</p>
        ) : highestRating > 0 && (
          <p className="text-sm text-muted-foreground">
            Highest{" "}
            <span className="font-medium tabular-nums text-foreground/80">
              {highestRating.toLocaleString()}
            </span>
          </p>
        )}
      </div>

      {!unrated && (
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
          {ranks.map(({ label, value }) => (
            <div key={label} className="space-y-0.5">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-xl font-medium tabular-nums text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
};

export default RatingOverview;
