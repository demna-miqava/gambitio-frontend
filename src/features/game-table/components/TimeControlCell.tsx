import { formatTimeControl, formatTimeOdds, timeOdds } from "@/utils/timeControl";

interface TimeControlCellProps {
  /** Null for bot games, which are untimed */
  type: string | null;
  time: number | null;
  increment: number | null;
  /** Each side's starting clock when they differ (time odds) */
  whiteTime?: number | null;
  blackTime?: number | null;
  /** False for a game that changed no ratings (casual, time odds, bots) */
  rated?: boolean;
  /** Played at a real board with the app as the clock (unrated) */
  tableGame?: boolean;
}

export const TimeControlCell = ({
  type,
  time,
  increment,
  whiteTime,
  blackTime,
  rated,
  tableGame = false,
}: TimeControlCellProps) => {
  const unrated = tableGame ? "Table game" : "Unrated";
  // Bot games have no clock and don't count for rating
  if (type === null || time === null) {
    return (
      <span className="text-xs text-muted-foreground">Unrated</span>
    );
  }

  // Time odds: white's clock, then black's. These games are unrated too
  const odds = timeOdds(whiteTime, blackTime);
  if (odds) {
    return (
      <span className="whitespace-nowrap text-xs text-muted-foreground">
        <span className="tabular-nums text-foreground">
          {formatTimeOdds(odds[0], odds[1], increment)}
        </span>{" "}
        {unrated}
      </span>
    );
  }

  // "5+0 Blitz": the label says what the icon used to; "5+0 Unrated" for a
  // casual game
  return (
    <span className="whitespace-nowrap text-xs text-muted-foreground">
      <span className="tabular-nums text-foreground">{formatTimeControl(time, increment)}</span>{" "}
      {rated === false ? unrated : <span className="capitalize">{type}</span>}
    </span>
  );
};
