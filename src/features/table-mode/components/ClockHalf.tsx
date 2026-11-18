import { useEffect, useState } from "react";
import { Flag, Handshake, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { timeLeft, type Side, type TableGameState } from "../utils/tableGame";
import { useNow } from "../hooks/useTableGame";
import { formatTableClock } from "../utils/formatTableClock";

/** Under this a clock shows tenths and turns red */
const LOW_TIME_MS = 10_000;
/** A first tap on Resign arms it; a second within this long confirms */
const RESIGN_CONFIRM_MS = 3_000;

interface ClockHalfProps {
  side: Side;
  name: string;
  state: TableGameState;
  /** The far half is turned to face the player across the table */
  flipped: boolean;
  onTap: () => void;
  onPause: () => void;
  onResign: () => void;
  onOfferDraw: () => void;
  onAnswerDraw: (accept: boolean) => void;
}

/**
 * One player's half of the screen: their clock, and pause, draw and resign
 * for them. In clock-only mode the clock itself is the button that ends
 * their turn (Black's tap starts White's clock).
 */
export const ClockHalf = ({
  side,
  name,
  state,
  flipped,
  onTap,
  onPause,
  onResign,
  onOfferDraw,
  onAnswerDraw,
}: ClockHalfProps) => {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), RESIGN_CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [armed]);

  const { status, turn, drawOffer, setup, result } = state;
  const active = status === "running" && turn === side;
  // Only the running clock ticks, and only this half re-renders for it
  const now = useNow(active);
  const timeMs = timeLeft(state, side, now);
  const low = timeMs < LOW_TIME_MS;
  const live = status === "running" || status === "paused";
  const sideLabel = side === "white" ? "White" : "Black";
  const canTap = setup.clockOnly && ((status === "running" && turn === side) || (status === "ready" && side === "black"));
  const theirOffer = drawOffer !== null && drawOffer !== side;

  let caption = active ? "Your move" : status === "ready" ? (setup.clockOnly && side === "black" ? "Tap to start White's clock" : "Waiting to start") : "";
  if (status === "paused") caption = "Paused";
  if (status === "over" && result) {
    const won = result.result === `${side}_win`;
    caption = result.result === "draw" ? "Draw" : won ? "Won" : "Lost";
  }

  const clock = (
    <>
      <span className="text-sm font-medium opacity-80">
        <span className="sr-only">{sideLabel}: </span>
        {name}
      </span>
      <span
        className={cn("font-display-num text-6xl tabular-nums leading-none sm:text-7xl", low && live && "text-loss")}
        role="timer"
        aria-label={`${sideLabel}'s clock: ${formatTableClock(timeMs, true)}`}
      >
        {formatTableClock(timeMs)}
      </span>
      <span className="min-h-5 text-sm opacity-80" aria-live="polite">
        {caption}
      </span>
    </>
  );

  return (
    <section
      aria-label={`${sideLabel}, ${name}`}
      className={cn(
        "flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-3 py-2 transition-colors",
        flipped && "rotate-180",
        active ? (low ? "bg-loss-bg" : "bg-primary text-primary-foreground") : "bg-card text-foreground"
      )}
    >
      {setup.clockOnly ? (
        <button
          type="button"
          onClick={onTap}
          disabled={!canTap}
          aria-keyshortcuts={canTap ? "Space" : undefined}
          className="flex w-full flex-1 flex-col items-center justify-center gap-2 rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring disabled:cursor-default"
        >
          {clock}
          {canTap && <span className="sr-only">Tap to end your turn</span>}
        </button>
      ) : (
        <div className="flex flex-col items-center gap-2">{clock}</div>
      )}

      {live && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {theirOffer ? (
            <>
              <span className="text-sm font-medium">Draw offered</span>
              <Button size="sm" variant="secondary" onClick={() => onAnswerDraw(true)}>
                Accept
              </Button>
              <Button size="sm" variant="ghost" className="text-current" onClick={() => onAnswerDraw(false)}>
                Decline
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" className="text-current" onClick={onPause} aria-keyshortcuts="P">
                <Pause aria-hidden="true" /> Pause
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-current"
                onClick={onOfferDraw}
                disabled={drawOffer === side}
              >
                <Handshake aria-hidden="true" /> {drawOffer === side ? "Draw offered" : "Draw"}
              </Button>
              <Button
                size="sm"
                variant={armed ? "destructive" : "ghost"}
                className={cn(!armed && "text-current")}
                onClick={() => {
                  if (armed) onResign();
                  else setArmed(true);
                }}
              >
                <Flag aria-hidden="true" /> {armed ? "Tap again to resign" : "Resign"}
              </Button>
            </>
          )}
        </div>
      )}
    </section>
  );
};
