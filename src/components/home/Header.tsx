import { Link } from "react-router-dom";
import { useUser } from "@/hooks/useUser";
import { getTimeControlIcon } from "@/utils/timeControl";
import { getProfileStatsRoute } from "@/constants/routes";
import { useGetStats } from "@/features/stats/hooks/useGetStats";
import RatingDelta from "@/features/stats/components/RatingDelta";
import { PageHeader } from "@/components/PageHeader";

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const RATINGS = [
  { key: "bullet", label: "Bullet" },
  { key: "blitz", label: "Blitz" },
  { key: "rapid", label: "Rapid" },
] as const;

export const Header = () => {
  const { id, username, bulletRating, blitzRating, rapidRating } = useUser();
  const { stats } = useGetStats();
  const ratings = { bullet: bulletRating, blitz: blitzRating, rapid: rapidRating };

  return (
    <PageHeader
      eyebrow={greeting()}
      title={<span className="break-words">{username || "player"}</span>}
      actions={
        <nav
          aria-label="Your ratings"
          className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:gap-3"
        >
          {RATINGS.map(({ key, label }) => {
            const Icon = getTimeControlIcon(key);
            const delta = stats?.[key]?.delta;
            return (
              <Link
                key={key}
                to={`${getProfileStatsRoute(id || 0)}?variant=${key}`}
                aria-label={`${label} rating ${ratings[key] ?? "unrated"}, view stats`}
                className="flex min-w-0 flex-col gap-1 rounded-xl border border-border/70 bg-card px-3 py-3 transition-colors hover:border-primary/40 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-w-28 sm:px-4 lg:min-w-32"
              >
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                  {label}
                </span>
                {/* Delta under the number on phones, beside it from sm */}
                <span className="flex flex-col items-start gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                  <span className="font-display-num text-2xl font-medium text-foreground">
                    {ratings[key] ?? "–"}
                  </span>
                  <RatingDelta delta={delta} className="text-xs font-medium" />
                </span>
              </Link>
            );
          })}
        </nav>
      }
    />
  );
};
