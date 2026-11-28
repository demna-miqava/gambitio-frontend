import { WifiOff } from "lucide-react";

/** Beside a player's name once they have been away from the game for a few seconds */
export const DisconnectedMark = () => (
  <span className="flex shrink-0 items-center gap-1 self-center text-xs font-semibold text-loss">
    <WifiOff className="size-3.5" strokeWidth={2} aria-hidden="true" />
    Disconnected
  </span>
);
