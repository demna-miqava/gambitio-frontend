import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ProvisionalMark } from "@/components/ProvisionalMark";
import RatingDelta from "@/features/stats/components/RatingDelta";
import { RatingSparkline } from "@/features/stats/components/RatingSparkline";
import { useGetStats } from "@/features/stats/hooks/useGetStats";
import type { ComprehensiveStatsData } from "@/features/stats/hooks/useGetComprehensiveStats";
import { useUser } from "@/hooks/useUser";
import { apiRequest } from "@/services";
import { getProfileStatsRoute } from "@/constants/routes";
import { QKEY_USER_STATS } from "@/constants/queryKeys";

const DAYS = "30";
const VARIANT = "all";

const SPEEDS = [
  { key: "bullet", label: "Bullet" },
  { key: "blitz", label: "Blitz" },
  { key: "rapid", label: "Rapid" },
] as const;

/** From this many games in 30 days the win/draw/loss bar says something; below it, counts only */
const BAR_FROM = 10;

type RecentStats = Pick<
  ComprehensiveStatsData,
  "totalGames" | "wins" | "draws" | "losses" | "bestWin" | "winStreak"
>;

/** "35 won, 4 drawn, 15 lost", leaving out what didn't happen ("2 lost") */
const resultsLine = ({ wins, draws, losses }: RecentStats) =>
  (
    [
      [wins, "won"],
      [draws, "drawn"],
      [losses, "lost"],
    ] as const
  )
    .filter(([count]) => count > 0)
    .map(([count, word]) => `${count.toLocaleString()} ${word}`)
    .join(", ");

/** The 30-day half of the panel: games, the results, best win and streak */
const LastThirtyDays = () => {
  const { id } = useUser();
  // Same query key as the stats page with "30 days" and "All" picked, so the
  // two share a cache entry
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: [QKEY_USER_STATS, id, DAYS, VARIANT],
    queryFn: () =>
      apiRequest<RecentStats>("get", `/users/${id}/stats`, {
        params: { days: DAYS, variant: VARIANT },
      }),
    enabled: !!id,
  });

  if (isPending) {
    return (
      <div className="space-y-2" role="status" aria-label="Loading the last 30 days">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="flex items-center justify-between gap-3 text-[13px] text-muted-foreground">
        Couldn't load the last 30 days.
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const total = data?.totalGames ?? 0;
  const extras = [
    data.bestWin > 0 && `best win ${data.bestWin}`,
    data.winStreak > 1 && `streak ${data.winStreak}`,
  ].filter(Boolean);

  return (
    <div className="text-[13px] leading-snug">
      <p className="flex items-baseline justify-between gap-3">
        <span className="text-muted-foreground">Last 30 days</span>
        <span className="tabular-nums">
          {total === 0
            ? "No rated games"
            : `${total.toLocaleString()} rated ${total === 1 ? "game" : "games"}`}
        </span>
      </p>
      {total >= BAR_FROM && (
        <div
          className="my-2 flex h-1.5 gap-[3px]"
          role="img"
          aria-label={`${data.wins} won, ${data.draws} drawn, ${data.losses} lost`}
        >
          {(
            [
              [data.wins, "bg-win"],
              [data.draws, "bg-faint opacity-60"],
              [data.losses, "bg-loss"],
            ] as const
          ).map(([count, color]) =>
            count > 0 ? (
              <i
                key={color}
                className={`rounded-[3px] ${color}`}
                style={{ flexGrow: count, flexBasis: 0 }}
              />
            ) : null
          )}
        </div>
      )}
      {total > 0 && (
        <p className="mt-0.5 flex flex-wrap items-baseline justify-between gap-x-3 tabular-nums">
          <span>{resultsLine(data)}</span>
          {extras.length > 0 && <span className="text-faint">{extras.join(", ")}</span>}
        </p>
      )}
    </div>
  );
};

/**
 * How it's going, in one panel: a rating row for each speed you've played
 * (with a small line of its last games and its change over 30 days, each
 * linking to that speed's stats), the
 * speeds you haven't played yet in one muted line, then the last 30 days.
 * Nothing is shown that isn't information yet: no starting rating for a
 * speed never played, no win/draw/loss bar for a handful of games.
 */
export const YourForm = () => {
  const { id, bulletRating, blitzRating, rapidRating, chessProfile } = useUser();
  const { stats, isPending, isError, refetch } = useGetStats();
  const ratings = { bullet: bulletRating, blitz: blitzRating, rapid: rapidRating };
  const provisional = {
    bullet: chessProfile?.bulletProvisional,
    blitz: chessProfile?.blitzProvisional,
    rapid: chessProfile?.rapidProvisional,
  };
  const played = SPEEDS.filter(({ key }) => (stats?.[key]?.games ?? 0) > 0);
  const notPlayed = SPEEDS.filter(({ key }) => (stats?.[key]?.games ?? 0) === 0);

  return (
    <section aria-labelledby="your-form-title" className="panel px-5 pt-5 pb-4">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h2 id="your-form-title" className="font-display text-[19px] leading-tight">
          Your form
        </h2>
        {played.length > 0 && (
          <Link
            to={`${getProfileStatsRoute(id || 0)}?days=${DAYS}`}
            className="inline-flex min-h-11 items-center text-[13px] font-semibold text-primary underline-offset-[3px] hover:underline sm:min-h-8"
          >
            Details
          </Link>
        )}
      </div>

      {isPending ? (
        <div className="space-y-3 py-2" role="status" aria-label="Loading your ratings">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
      ) : isError ? (
        <div className="flex items-center justify-between gap-3 py-2 text-[13px] text-muted-foreground">
          Couldn't load your ratings.
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : played.length === 0 ? (
        <p className="py-1 text-sm text-muted-foreground">
          Your ratings show up here after your first rated game. Games against the computer aren't
          rated.
        </p>
      ) : (
        <>
          <nav aria-label="Your ratings">
            {played.map(({ key, label }) => {
              const delta = stats?.[key]?.delta;
              return (
                <Link
                  key={key}
                  to={`${getProfileStatsRoute(id || 0)}?variant=${key}`}
                  aria-label={`${label} rating ${ratings[key] ?? "unrated"}${provisional[key] ? " (provisional)" : ""}${
                    delta ? `, ${delta > 0 ? "up" : "down"} ${Math.abs(delta)} in the last 30 days` : ""
                  }, view stats`}
                  title={delta ? "Rating change in the last 30 days" : undefined}
                  className="group grid min-h-11 grid-cols-[minmax(0,1fr)_auto_auto_2.75rem] items-center gap-2 rounded-md py-[7px] outline-none not-first:border-t not-first:border-border focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="font-medium">{label}</span>
                  {/* The last dozen rated games: which way it has been going */}
                  <RatingSparkline ratings={stats?.[key]?.recent} />
                  <b className="font-display-num text-[17px] leading-tight font-semibold text-right group-hover:underline group-hover:underline-offset-4">
                    {ratings[key] ?? "–"}
                    {ratings[key] !== undefined && <ProvisionalMark provisional={provisional[key]} />}
                  </b>
                  <RatingDelta delta={delta} className="text-right text-[13px]" />
                </Link>
              );
            })}
          </nav>
          {notPlayed.length > 0 && (
            <p className="mt-0.5 text-[13px] text-faint">
              Not played yet: {notPlayed.map(({ label }) => label.toLowerCase()).join(", ")}
            </p>
          )}
          {played.some(({ key }) => provisional[key]) && (
            <p className="mt-0.5 text-[13px] text-faint">A question mark means the rating is still settling.</p>
          )}
          <div className="mt-3 border-t border-border pt-3">
            <LastThirtyDays />
          </div>
        </>
      )}
    </section>
  );
};
