import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { ProvisionalMark } from "@/components/ProvisionalMark";
import { Pagination } from "@/components/Pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { QKEY_TOURNAMENT_STANDINGS } from "@/constants/queryKeys";
import { getProfileRoute } from "@/constants/routes";
import { useAvatarSrc } from "@/hooks/useAvatarSrc";
import { cn } from "@/lib/utils";
import { getTournamentStandings } from "@/services/tournaments";
import type { Standing } from "../types";
import { sheetDigits } from "../utils/tournamentFormat";

/** Lines per page: what the lobby's live state carries for the first one */
export const STANDINGS_PAGE_SIZE = 20;
/** Wins in a row from which points count double */
const STREAK_AFTER = 2;
/** Digits of the score sheet shown in a row; the newest ones */
const SHEET_SHOWN = 10;

const ScoreSheet = ({ sheet }: { sheet: string }) => {
  const digits = sheetDigits(sheet).slice(-SHEET_SHOWN);
  if (digits.length === 0) return <span className="text-muted-foreground">–</span>;
  return (
    <span className="font-mono text-sm tracking-[0.2em]" aria-label={`Points per game: ${digits.map((d) => d.points).join(", ")}`}>
      {digits.map(({ points, onStreak }, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={cn(
            points === "0" && "text-muted-foreground/70",
            onStreak ? "font-semibold text-primary" : points !== "0" && "text-foreground"
          )}
        >
          {points}
        </span>
      ))}
    </span>
  );
};

const Row = ({ line, isMe, avatarUrl }: { line: Standing; isMe: boolean; avatarUrl: string | null | undefined }) => {
  const out = line.status !== "active";
  return (
    <tr className={cn("border-t border-border", isMe && "bg-brand-soft/60")}>
      <td className="w-10 py-2.5 pr-1 pl-3 text-right text-sm tabular-nums text-muted-foreground sm:pl-4">
        {line.rank}
      </td>
      <td className="max-w-0 py-2.5 pr-2 pl-2">
        <span className={cn("flex min-w-0 items-center gap-2.5", out && "opacity-60")}>
          <PlayerAvatar username={line.username} avatarUrl={avatarUrl} size="sm" />
          <span className="min-w-0 leading-tight">
            <Link
              to={getProfileRoute(line.userId)}
              className="block truncate text-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
            >
              {line.username}
              {isMe && <span className="sr-only"> (you)</span>}
            </Link>
            <span className="block text-xs tabular-nums text-muted-foreground">
              {line.rating}
              <ProvisionalMark provisional={line.provisional} />
              {line.status === "paused" && " · paused"}
              {line.status === "withdrawn" && " · left"}
            </span>
          </span>
        </span>
      </td>
      <td className="hidden py-2.5 pr-3 text-right whitespace-nowrap sm:table-cell">
        <ScoreSheet sheet={line.sheet} />
      </td>
      <td className="w-16 py-2.5 pr-3 text-right whitespace-nowrap sm:pr-4">
        <span className="inline-flex items-center justify-end gap-1">
          {line.streak >= STREAK_AFTER && (
            <Flame className="size-3.5 text-primary" aria-label="On a streak: points count double" />
          )}
          <span className="font-display-num text-lg text-foreground">{line.score}</span>
        </span>
      </td>
    </tr>
  );
};

interface StandingsTableProps {
  tournamentId: number;
  /** The first page, kept live by the lobby */
  top: Standing[];
  total: number;
  /** The viewer: their line is marked, and shown below when it isn't on the page */
  me: Standing | null;
}

/**
 * The standings. The first page is the lobby's live state; later pages are
 * fetched (and fetched again when the standings change).
 */
export const StandingsTable = ({ tournamentId, top, total, me }: StandingsTableProps) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(total / STANDINGS_PAGE_SIZE));
  const shownPage = Math.min(page, totalPages);
  const avatarSrc = useAvatarSrc();
  const later = useQuery({
    queryKey: [QKEY_TOURNAMENT_STANDINGS, tournamentId, shownPage],
    queryFn: () => getTournamentStandings(tournamentId, shownPage, STANDINGS_PAGE_SIZE),
    enabled: shownPage > 1,
    placeholderData: (previous) => previous,
  });
  const lines = shownPage === 1 ? top : (later.data?.data ?? []);
  const loading = shownPage > 1 && later.isPending;
  const mineShown = me !== null && lines.some((line) => line.userId === me.userId);

  if (total === 0) {
    return <p className="rounded-2xl bg-card px-4 py-8 text-center text-sm text-muted-foreground">Nobody has joined yet.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl bg-card">
        <table className="w-full table-fixed border-collapse">
          <caption className="sr-only">Standings</caption>
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th scope="col" className="w-10 py-2 pr-1 pl-3 text-right font-normal sm:pl-4">
                #
              </th>
              <th scope="col" className="py-2 pl-2 text-left font-normal">
                Player
              </th>
              <th scope="col" className="hidden w-44 py-2 pr-3 text-right font-normal sm:table-cell">
                Games
              </th>
              <th scope="col" className="w-16 py-2 pr-3 text-right font-normal sm:pr-4">
                Points
              </th>
            </tr>
          </thead>
          <tbody aria-busy={loading || undefined}>
            {loading
              ? [0, 1, 2].map((i) => (
                  <tr key={i} className="border-t border-border">
                    <td colSpan={4} className="px-4 py-2.5">
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))
              : lines.map((line) => (
                  <Row
                    key={line.userId}
                    line={line}
                    isMe={line.userId === me?.userId}
                    avatarUrl={avatarSrc(line.userId, line.avatarUrl)}
                  />
                ))}
            {/* The viewer's own line, when it is on another page */}
            {!loading && me && !mineShown && (
              <Row line={me} isMe avatarUrl={avatarSrc(me.userId, me.avatarUrl)} />
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={shownPage}
        totalPages={totalPages}
        onPageChange={setPage}
        hasNextPage={shownPage < totalPages}
        hasPreviousPage={shownPage > 1}
      />
    </div>
  );
};
