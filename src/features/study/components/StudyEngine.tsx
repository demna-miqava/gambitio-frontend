import { useId } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EngineAnalysisPanel, useAnalysis } from "@/features/engine-analysis";
import { cn } from "@/lib/utils";

/**
 * The engine in a study room: a switch and, while it's on, the engine's
 * lines for the shared position. It runs in this browser and is only shown
 * to the person who switched it on; a line's first move, once clicked, is
 * played in the room like any other move.
 */
export const StudyEngine = ({
  fen,
  onPlayMove,
}: {
  /** The shared position */
  fen: string;
  onPlayMove: (uci: string) => void;
}) => {
  const { engineEnabled, setEngineEnabled, analysis } = useAnalysis();
  const switchId = useId();

  return (
    <div className="space-y-2">
      <div className="flex min-h-7 items-center gap-2">
        <Label htmlFor={switchId} className="text-sm font-medium">
          Engine
        </Label>
        <span className="text-xs text-muted-foreground">only for you</span>
        {engineEnabled && (
          <span className="ml-auto flex items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
            <Loader2
              className={cn("size-3 animate-spin", !analysis.isAnalyzing && "invisible")}
              aria-hidden="true"
            />
            Depth {analysis.depth}
          </span>
        )}
        <Switch
          id={switchId}
          checked={engineEnabled}
          onCheckedChange={setEngineEnabled}
          className={cn(!engineEnabled && "ml-auto")}
        />
      </div>
      {engineEnabled && (
        // Its own header row is replaced by the one above
        <EngineAnalysisPanel
          numLines={3}
          fen={fen}
          onPlayMove={onPlayMove}
          compactOnMobile
          hideDesktopHeader
        />
      )}
    </div>
  );
};
