import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useGameSetup } from "@/features/create-game/GameSetupContext";
import { SPEED_LABEL } from "@/features/game/constants/speed";
import { Button } from "@/components/ui/button";
import { PillRadioGroup } from "@/components/PillRadioGroup";
import { RATED_OPTIONS } from "@/features/matchmaking/constants/ratedOptions";
import { useUser } from "@/hooks/useUser";
import { formatTimeControl } from "@/utils/timeControl";

const elapsedLabel = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/** Counts the seconds a search has run, from 0 each time one starts */
const Elapsed = () => {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const tick = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(tick);
  }, []);
  return (
    // Counting up is noise for a screen reader: the lines above say it
    <p className="font-display-num text-[28px] leading-tight text-foreground" aria-hidden="true">
      {elapsedLabel(seconds)}
    </p>
  );
};

/**
 * Rated or Casual and Play, for the time control picked above, and once
 * pressed the search in their place: what is being looked for and near which rating, how long it
 * has run, and Cancel.
 */
export const Actions = () => {
  const { timeControl, setShouldConnect, isSearching, isConnecting, rated, setRated } =
    useGameSetup();
  const { bulletRating, blitzRating, rapidRating } = useUser();
  const label = formatTimeControl(timeControl.time, timeControl.increment);
  const speed = timeControl.format;
  const rating = { bullet: bulletRating, blitz: blitzRating, rapid: rapidRating }[speed];

  if (isSearching) {
    return (
      <div
        className="flex flex-col items-center gap-2 px-4 py-10 text-center"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="mb-2 size-9 animate-spin text-primary" strokeWidth={1.5} aria-hidden="true" />
        <p className="font-display text-[22px] leading-tight">
          {isConnecting ? "Connecting" : "Finding an opponent"}
        </p>
        <p className="text-sm text-muted-foreground">
          {SPEED_LABEL[speed]} <span className="tabular-nums">{label}</span>, {rated ? "rated" : "casual"}
          {rating !== undefined && (
            <>
              , near <span className="tabular-nums">{rating}</span>
            </>
          )}
        </p>
        <Elapsed />
        <Button size="lg" variant="outline" className="mt-2" onClick={() => setShouldConnect(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PillRadioGroup
        label="Rated or casual"
        value={rated ? "rated" : "casual"}
        onValueChange={(value) => setRated(value === "rated")}
        options={RATED_OPTIONS}
        className="grid w-full"
      />
      <Button
        disabled={!timeControl.format}
        onClick={() => setShouldConnect(true)}
        size="xl"
        className="w-full"
      >
        Play <span className="tabular-nums">{label}</span>
      </Button>
      {speed && (
        <p className="text-[13px] text-faint">
          {rated
            ? `You will be paired with someone close to your ${speed} rating.`
            : `A casual game changes no ratings. You will still be paired with someone close to your ${speed} rating.`}
        </p>
      )}
    </div>
  );
};
