import { Link } from "react-router-dom";
import { BookOpen, Bot, Crosshair, Grid3x3, Puzzle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES, getSeriesRoute } from "@/constants/routes";
import { useUser } from "@/hooks/useUser";
import { useUserSeries } from "@/features/series/hooks/useSeries";
import {
  formatScoreline,
  isTimedMatch,
  playersFor,
  seriesFormatLabel,
  seriesNoun,
} from "@/features/series/utils/seriesFormat";
import { useRepertoire } from "@/features/repertoire/hooks/useRepertoire";
import { isDue as isLineDue } from "@/features/repertoire/utils/lines";
import { isDue as isDrillDue, useConversionDrills } from "@/features/conversion-drills/hooks/useConversionDrills";
import { UpNextRow } from "./UpNextRow";

// One width for every row's button, so they line up down the list
const actionClass = "min-h-11 min-w-31 sm:min-h-9";

/**
 * A series or match with a friend that still has games to play: the score
 * as the row's lead, how it stands, and the way to its page (where the next
 * game starts). One row per series; nothing while there are none.
 */
export const SeriesRows = () => {
  const { id } = useUser();
  const { data } = useUserSeries(id);
  const active = (data ?? []).filter((series) => series.status === "active");

  return active.map((series) => {
    const [you, them] = playersFor(series, id);
    const noun = seriesNoun(series);
    const next = series.next;
    const standing =
      you.score === them.score
        ? `It is level at ${formatScoreline(you, them)}.`
        : you.score > them.score
          ? `You lead ${formatScoreline(you, them)}.`
          : `${them.username} leads ${formatScoreline(them, you)}.`;
    const upcoming = !next
      ? ""
      : isTimedMatch(series)
        ? ` Game ${next.number} is next.`
        : ` Game ${next.number} is ready, and you have ${next.whiteId === id ? "White" : "Black"}.`;
    return (
      <UpNextRow
        key={series.id}
        aria-label={`Your ${noun} with ${them.username}`}
        accent
        icon={
          <span className="font-display-num text-[15px] font-semibold" aria-hidden="true">
            {formatScoreline(you, them)}
          </span>
        }
        title={`${seriesFormatLabel(series).replace(/^./, (c) => c.toUpperCase())} with ${them.username}`}
        description={`${standing}${upcoming}`}
        actions={
          <Button asChild className={actionClass}>
            <Link to={getSeriesRoute(series.id)}>Open the {noun}</Link>
          </Button>
        }
      />
    );
  });
};

/** Repertoire lines whose review is due. Nothing while none are. */
export const RepertoireDueRow = () => {
  const { data } = useRepertoire();
  // Read once per render of Home: lines fall due by the day, not the second
  const now = Date.now();
  const due = (data ?? []).filter((line) => isLineDue(line, now)).length;
  if (due === 0) return null;

  return (
    <UpNextRow
      aria-label="Repertoire"
      icon={<BookOpen className="size-5" strokeWidth={1.75} aria-hidden="true" />}
      title={`${due} repertoire ${due === 1 ? "line is" : "lines are"} due`}
      description="Play them from memory before they fade."
      actions={
        <Button asChild variant="outline" className={actionClass}>
          <Link to={ROUTES.REPERTOIRE}>Review {due === 1 ? "it" : "them"}</Link>
        </Button>
      }
    />
  );
};

/** Conversion drills (won positions from the player's games) that are due. */
export const DrillsDueRow = () => {
  const { data } = useConversionDrills();
  const due = (data ?? []).filter((drill) => isDrillDue(drill)).length;
  if (due === 0) return null;

  return (
    <UpNextRow
      aria-label="Conversion drills"
      icon={<Crosshair className="size-5" strokeWidth={1.75} aria-hidden="true" />}
      title={`${due} conversion ${due === 1 ? "drill is" : "drills are"} due`}
      description="Winning positions from your games that slipped away. Play them out again."
      actions={
        <Button asChild variant="outline" className={actionClass}>
          <Link to={ROUTES.CONVERSION_DRILLS}>Start drills</Link>
        </Button>
      }
    />
  );
};

/**
 * For an account with no games yet, in the place of what is waiting on a
 * returning player: three low-pressure ways to begin.
 */
export const StartHereRows = () => (
  <>
    <UpNextRow
      icon={<Bot className="size-5" strokeWidth={1.75} aria-hidden="true" />}
      title="Warm up against a bot"
      description="No rating at stake, and you can undo any move. Strengths run from 300 to 2400."
      actions={
        <Button asChild className={actionClass}>
          <Link to={ROUTES.PLAY_BOTS}>Play a bot</Link>
        </Button>
      }
    />
    <UpNextRow
      icon={<Puzzle className="size-5" strokeWidth={1.75} aria-hidden="true" />}
      title="Solve a few puzzles"
      description="Puzzles have their own rating and adjust to you as you go."
      actions={
        <Button asChild variant="outline" className={actionClass}>
          <Link to={ROUTES.PUZZLES}>Open puzzles</Link>
        </Button>
      }
    />
    <UpNextRow
      icon={<Grid3x3 className="size-5" strokeWidth={1.75} aria-hidden="true" />}
      title="Learn the coordinates"
      description="A short drill for reading squares like e4 at a glance."
      actions={
        <Button asChild variant="outline" className={actionClass}>
          <Link to={ROUTES.COORDINATES}>Practice</Link>
        </Button>
      }
    />
  </>
);
