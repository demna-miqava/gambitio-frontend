import { Bot } from "lucide-react";
import { getTimeControlIcon, formatTimeControl } from "@/utils/timeControl";

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
      <div className="flex items-center gap-2 text-xs">
        <Bot className="size-4" aria-hidden="true" />
        <span className="font-medium text-muted-foreground">Unrated</span>
      </div>
    );
  }

  const Icon = getTimeControlIcon(type);
  const displayText = formatTimeControl(time, increment);

  return (
    <div className="flex items-center gap-2 text-xs">
      {Icon && <Icon className="size-4" aria-hidden="true" />}
      <span className="font-medium tabular-nums text-muted-foreground">{displayText}</span>
    </div>
  );
};
