import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MiniBoard } from "@/features/endgames/components/MiniBoard";
import { puzzleService } from "@/features/puzzles/services/puzzle.service";
import { readStoredPuzzleTheme } from "@/features/puzzles/hooks/usePuzzleTheme";
import { useGetStats } from "@/features/stats/hooks/useGetStats";
import RatingDelta from "@/features/stats/components/RatingDelta";
import { QKEY_HOME_NEXT_PUZZLE, QKEY_PUZZLE_STREAK } from "@/constants/queryKeys";
import { Flame } from "lucide-react";
import { ROUTES, getPuzzleModeRoute } from "@/constants/routes";
import { cn } from "@/lib/utils";

/**
 * The puzzle Infinite mode will open with, on a small board: the first of
 * the same request (rated puzzles near your puzzle rating that you haven't
 * tried, in a fixed order, with the theme filter Infinite mode remembers).
 * So "Solve puzzle" opens exactly this one. Its position is already the
 * solver's turn (the import plays the opponent's first move), drawn from the
 * solver's side.
 *
 * Beside the title: the days in a row with a solved puzzle, once there is
 * such a run (stepped back while today's puzzle is still to do); before
 * that, the player's puzzle rating, which otherwise sits under the board.
 */
export const NextPuzzle = () => {
  // Read once: the link below carries it, so Infinite mode uses the same filter
  const [theme] = useState(readStoredPuzzleTheme);
  const { data: puzzle, isPending, isError, refetch } = useQuery({
    queryKey: [QKEY_HOME_NEXT_PUZZLE, theme],
    queryFn: () => puzzleService.fetchPuzzles({ mode: "rated", theme: theme || undefined }),
    select: (page) => page.data[0] ?? null,
    // Coming back from solving: the next one, not the one just tried
    staleTime: 0,
  });
  const { puzzle: stats } = useGetStats();
  // Nice to have: no skeleton, no error. Without it the rating shows instead
  const { data: streak } = useQuery({
    queryKey: [QKEY_PUZZLE_STREAK],
    queryFn: puzzleService.fetchStreak,
    // Coming back from solving: today may count now
    staleTime: 0,
    retry: false,
  });
  const hasStreak = (streak?.days ?? 0) > 0;

  const solveUrl = `${getPuzzleModeRoute("infinite")}${theme ? `?theme=${encodeURIComponent(theme)}` : ""}`;
  const toMove = puzzle?.fen.split(" ")[1] === "b" ? "black" : "white";

  return (
    <section aria-labelledby="next-puzzle-title" className="panel px-5 pt-5 pb-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="next-puzzle-title" className="font-display text-[19px] leading-tight">
          Puzzle
        </h2>
        {hasStreak ? (
          <span
            className={cn(
              "flex items-center gap-1.5 text-[13px] font-semibold tabular-nums",
              streak!.solvedToday ? "text-foreground" : "text-faint"
            )}
            title={streak!.solvedToday ? undefined : "Solve a puzzle today to keep it going"}
          >
            <Flame
              className={cn("size-3.5", streak!.solvedToday && "text-primary")}
              strokeWidth={2}
              aria-hidden="true"
            />
            {streak!.days} day streak
            {!streak!.solvedToday && <span className="sr-only">. Solve a puzzle today to keep it going</span>}
          </span>
        ) : (
          stats && (
            <span className="flex items-baseline gap-2 text-[13px] text-faint">
              Your rating
              <b className="font-display-num text-[15px] font-semibold text-foreground">{stats.rating}</b>
              <RatingDelta delta={stats.delta} className="text-[13px]" />
            </span>
          )
        )}
      </div>

      {isPending ? (
        <div role="status" aria-label="Loading a puzzle">
          <Skeleton className="aspect-square w-full rounded-[4px]" />
          <Skeleton className="mt-3 h-9 w-full" />
        </div>
      ) : isError ? (
        <div className="flex items-center justify-between gap-3 text-[13px] text-muted-foreground">
          Couldn't load a puzzle.
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : !puzzle ? (
        <div className="flex items-center justify-between gap-3 text-[13px] text-muted-foreground">
          {theme ? "No puzzles left in this theme." : "You've tried every puzzle near your rating."}
          <Button asChild variant="outline" size="sm">
            <Link to={ROUTES.PUZZLES}>Other modes</Link>
          </Button>
        </div>
      ) : (
        <>
          <Link
            to={solveUrl}
            aria-label={`Solve this puzzle, ${toMove} to move, rated ${puzzle.rating}`}
            className="block rounded-[4px] outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <MiniBoard fen={puzzle.fen} orientation={toMove} className="overflow-hidden rounded-[4px]" />
          </Link>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="grid grid-cols-[auto_1fr] items-center gap-x-2 leading-tight">
              {/* The side to move, as its colour: read at a glance before the words */}
              <span
                aria-hidden="true"
                className={cn(
                  "size-3.5 rounded-[3px] shadow-[inset_0_0_0_1.5px_var(--color-piece-black)]",
                  toMove === "white" ? "bg-piece-white" : "bg-piece-black"
                )}
              />
              <span className="text-sm font-semibold first-letter:uppercase">{toMove} to move</span>
              <span className="col-start-2 text-[13px] text-faint tabular-nums">
                Rated {puzzle.rating}
                {/* The streak has the header: the player's own rating moves here */}
                {hasStreak && stats && (
                  <>
                    {" · "}yours {stats.rating}
                  </>
                )}
              </span>
            </p>
            <Button asChild className="max-sm:h-11">
              <Link to={solveUrl}>Solve puzzle</Link>
            </Button>
          </div>
        </>
      )}
    </section>
  );
};
