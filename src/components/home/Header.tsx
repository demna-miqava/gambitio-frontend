import { Link } from "react-router-dom";
import { useUser } from "@/hooks/useUser";
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
          className="flex w-full justify-between gap-6 sm:w-auto sm:justify-start sm:gap-9"
        >
          {RATINGS.map(({ key, label }) => {
            const delta = stats?.[key]?.delta;
            return (
              <Link
                key={key}
                to={`${getProfileStatsRoute(id || 0)}?variant=${key}`}
                aria-label={`${label} rating ${ratings[key] ?? "unrated"}${
                  delta ? `, ${delta > 0 ? "up" : "down"} ${Math.abs(delta)} in the last 30 days` : ""
                }, view stats`}
                title={delta ? "Rating change in the last 30 days" : undefined}
                className="group flex min-w-0 flex-col gap-0.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background [&_.font-display-num]:underline-offset-4 hover:[&_.font-display-num]:underline"
              >
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-display-num text-2xl leading-tight text-foreground sm:text-[1.75rem]">
                    {ratings[key] ?? "–"}
                  </span>
                  <RatingDelta delta={delta} className="text-xs" />
                </span>
              </Link>
            );
          })}
        </nav>
      }
    />
  );
};
