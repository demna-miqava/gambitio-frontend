import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { useMatchmaking } from "@/features/matchmaking/hooks/useMatchmaking";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { formatTimeControl } from "@/utils/timeControl";
import { getTimeControlFormat } from "@/features/create-game/constants/timeControls";

type Pairing = { time: number; increment: number; label: string; type: string };

const PAIRINGS: Pairing[] = [
  [60, 0],
  [120, 1],
  [180, 0],
  [180, 2],
  [300, 0],
  [600, 0],
  [900, 10],
  [1800, 0],
].map(([time, increment]) => {
  // Same thresholds the server uses: < 3 min bullet, < 10 min blitz, else rapid
  const format = getTimeControlFormat(time);
  return {
    time,
    increment,
    label: formatTimeControl(time, increment),
    type: format.charAt(0).toUpperCase() + format.slice(1),
  };
});

/** One tap to find an opponent at a chosen time control. */
export const QuickPairing = () => {
  const [selected, setSelected] = useState<Pairing>(PAIRINGS[4]);
  const { setShouldConnect, isSearching, isConnecting } = useMatchmaking({
    time: selected.time,
    increment: selected.increment,
  });

  const start = (pairing: Pairing) => {
    // Locked once a search started (the tiles are hidden then anyway)
    if (isSearching) return;
    setSelected(pairing);
    setShouldConnect(true);
  };

  return (
    <section
      aria-labelledby="quick-pairing-title"
      className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6"
    >
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <h2 id="quick-pairing-title" className="font-display text-2xl font-medium">
            Quick pairing
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a time control and we'll find you an opponent.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link to={ROUTES.PLAY} state={{ section: "new" }}>
            <SlidersHorizontal aria-hidden="true" /> More options
          </Link>
        </Button>
      </div>

      {isSearching ? (
        <div
          className="relative mt-6 flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-8 text-center"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
          <div>
            <p className="font-medium">
              {isConnecting ? "Connecting…" : "Finding an opponent…"}
            </p>
            <p className="text-sm text-muted-foreground tabular-nums">
              {selected.label} · {selected.type}
            </p>
          </div>
          <Button size="lg"
            variant="outline"
            onClick={() => setShouldConnect(false)}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <div className="relative mt-5 grid grid-cols-4 gap-2 sm:mt-6 sm:gap-2.5">
          {PAIRINGS.map((pairing) => (
            <button
              key={pairing.label}
              type="button"
              onClick={() => start(pairing)}
              className={cn(
                "group flex h-16 flex-col items-center justify-center gap-0.5 rounded-xl border border-border/70 bg-background/60 transition-colors sm:h-20",
                "hover:border-primary/50 hover:bg-brand-soft active:bg-brand-soft active:border-primary",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              aria-label={`Play ${pairing.label} ${pairing.type}`}
            >
              <span className="font-display-num text-lg font-medium text-foreground sm:text-2xl">
                {pairing.label}
              </span>
              <span className="text-xs text-muted-foreground group-hover:text-foreground/70">
                {pairing.type}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};
