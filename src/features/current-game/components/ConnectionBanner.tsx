import { useEffect, useState } from "react";
import { Loader2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GameConnectionStatus } from "@/features/game/hooks/useGameWebSocket";

// The first connect is usually instant; only mention it if it isn't
const CONNECTING_DELAY_MS = 1000;

/**
 * Sits over the top of the board while the game socket isn't open. The board
 * is locked meanwhile but the clocks keep running; the server keeps the real
 * clocks and resends the game when the connection comes back.
 */
export const ConnectionBanner = ({ status }: { status: GameConnectionStatus }) => {
  const [slowConnect, setSlowConnect] = useState(false);

  useEffect(() => {
    if (status !== "connecting") return;
    const timer = setTimeout(() => setSlowConnect(true), CONNECTING_DELAY_MS);
    return () => {
      clearTimeout(timer);
      setSlowConnect(false);
    };
  }, [status]);

  if (status === "open" || (status === "connecting" && !slowConnect)) return null;

  if (status === "lost") {
    return (
      <div
        role="alert"
        className="absolute inset-x-2 top-2 z-20 flex items-center gap-3 rounded-xl border border-border bg-popover/95 p-3 text-popover-foreground shadow-lg backdrop-blur sm:inset-x-4 sm:top-4"
      >
        <WifiOff className="size-5 shrink-0 text-loss" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Connection lost</p>
          <p className="text-xs text-muted-foreground">
            Reload to get back into the game.
          </p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="absolute inset-x-2 top-2 z-20 flex items-center gap-3 rounded-xl border border-border bg-popover/95 p-3 text-popover-foreground shadow-lg backdrop-blur sm:inset-x-4 sm:top-4"
    >
      <Loader2 className="size-5 shrink-0 animate-spin text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {status === "connecting" ? "Connecting…" : "Reconnecting…"}
        </p>
        <p className="text-xs text-muted-foreground">
          Your clock is still running. You can move again once you're back online.
        </p>
      </div>
    </div>
  );
};
