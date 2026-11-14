import { formatTimeControl } from "@/utils/timeControl";

interface TimeControlCellProps {
  /** Null for bot games, which are untimed */
  type: string | null;
  time: number | null;
  increment: number | null;
}

export const TimeControlCell = ({
  type,
  time,
  increment,
}: TimeControlCellProps) => {
  // Bot games have no clock and don't count for rating
  if (type === null || time === null) {
    return (
      <span className="text-xs text-muted-foreground">Unrated</span>
    );
  }

  // "5+0 Blitz": the label says what the icon used to
  return (
    <span className="whitespace-nowrap text-xs text-muted-foreground">
      <span className="tabular-nums text-foreground">{formatTimeControl(time, increment)}</span>{" "}
      <span className="capitalize">{type}</span>
    </span>
  );
};
