import { Loader2 } from "lucide-react";
import { useGameSetup } from "@/features/create-game/GameSetupContext";
import { Button } from "@/components/ui/button";
import { formatTimeControl } from "@/utils/timeControl";

export const Actions = () => {
  const { timeControl, setShouldConnect, isSearching, isConnecting } =
    useGameSetup();
  const label = formatTimeControl(timeControl.time, timeControl.increment);

  if (isSearching) {
    return (
      <div
        className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-10 text-center"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
        <div>
          <p className="font-medium">
            {isConnecting ? "Connecting…" : "Finding an opponent…"}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="tabular-nums">{label}</span> ·{" "}
            <span className="capitalize">{timeControl.format}</span>
          </p>
        </div>
        <Button size="lg"
          variant="outline"
          onClick={() => setShouldConnect(false)}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      disabled={!timeControl.format}
      onClick={() => setShouldConnect(true)}
      size="xl"
      className="w-full"
    >
      Play <span className="tabular-nums">{label}</span>
    </Button>
  );
};
