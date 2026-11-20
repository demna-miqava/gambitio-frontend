import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
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
    <section aria-labelledby="quick-pairing-title" className="rounded-2xl bg-card p-5 sm:p-6">
      <h2 id="quick-pairing-title" className="font-display text-2xl">
        Quick pairing
      </h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Pick a time control and we'll find you an opponent.
      </p>

      {isSearching ? (
        <div
          className="mt-5 flex min-h-[9.75rem] flex-col items-center justify-center gap-3 rounded-xl bg-background px-4 py-6 text-center"
          role="status"
          aria-live="polite"
        >
          <div>
            <p className="flex items-center gap-2.5 font-display text-2xl">
              {isConnecting ? "Connecting…" : "Finding an opponent…"}
              <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
            </p>
            <p className="text-sm text-muted-foreground tabular-nums">
              {selected.label} · {selected.type}
            </p>
          </div>
          <Button variant="outline" onClick={() => setShouldConnect(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-4 gap-2 sm:gap-2.5">
          {PAIRINGS.map((pairing) => (
            <button
              key={pairing.label}
              type="button"
              onClick={() => start(pairing)}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-0.5 rounded-xl bg-background transition-colors sm:h-[4.625rem]",
                "hover:bg-primary-solid hover:text-primary-solid-foreground active:bg-primary-solid/90 active:text-primary-solid-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              )}
              aria-label={`Play ${pairing.label} ${pairing.type}`}
            >
              <span className="font-display-num text-xl leading-none sm:text-[1.625rem]">
                {pairing.label}
              </span>
              <span className="text-xs opacity-70">{pairing.type}</span>
            </button>
          ))}
        </div>
      )}
      <div className="mt-4 flex items-center justify-between gap-4 text-sm text-muted-foreground">
        <span>Custom time, the computer or table mode</span>
        <Link
          to={ROUTES.PLAY}
          state={{ section: "new" }}
          className="relative touch-target shrink-0 underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          More options →
        </Link>
      </div>
    </section>
  );
};
