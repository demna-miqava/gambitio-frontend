import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Settings2 } from "lucide-react";
import { PLAY_TIME_CONTROLS } from "../constants/timeControls";
import { useGameSetup } from "../GameSetupContext";
import { formatTimeControl } from "@/utils/timeControl";
import { cn } from "@/lib/utils";

interface TimeControlsSectionProps {
  /** Shows a "Custom" tile that opens the custom picker */
  showCustom?: boolean;
}

const valueOf = (time: number, increment: number) => `${time}+${increment}`;

/**
 * All time controls visible at once, grouped by speed. One radio group: a
 * single Tab stop, arrow keys move between tiles.
 */
export const TimeControlsSection = ({ showCustom = true }: TimeControlsSectionProps) => {
  const { timeControl, updateTimeControl, openCustomTime, isSearching } =
    useGameSetup();
  const isPreset = PLAY_TIME_CONTROLS.some(({ options }) =>
    options.some(
      (o) => o.time === timeControl.time && o.increment === timeControl.increment
    )
  );

  const select = (value: string) => {
    for (const { label: format, options } of PLAY_TIME_CONTROLS) {
      const option = options.find((o) => valueOf(o.time, o.increment) === value);
      if (option) updateTimeControl(format, option.time, option.increment);
    }
  };

  return (
    <div className="space-y-4">
      <RadioGroupPrimitive.Root
        value={isPreset ? valueOf(timeControl.time, timeControl.increment) : ""}
        onValueChange={select}
        disabled={isSearching}
        aria-label="Time control"
        className="space-y-4"
      >
        {PLAY_TIME_CONTROLS.map(({ label: format, icon: Icon, options }) => (
          <div key={format} className="space-y-2">
            <p
              className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground"
              aria-hidden="true"
            >
              <Icon className="size-3.5" />
              {format}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {options.map(({ label, time, increment }) => (
                <RadioGroupPrimitive.Item
                  key={valueOf(time, increment)}
                  value={valueOf(time, increment)}
                  aria-label={`${label} ${format}`}
                  className={cn(
                    "h-11 rounded-lg border text-sm font-semibold tabular-nums transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "border-border bg-background text-foreground/85 hover:border-primary/40 hover:bg-accent",
                    "data-[state=checked]:border-primary data-[state=checked]:bg-brand-soft data-[state=checked]:text-foreground",
                    "disabled:pointer-events-none disabled:opacity-50"
                  )}
                >
                  {label}
                </RadioGroupPrimitive.Item>
              ))}
            </div>
          </div>
        ))}
      </RadioGroupPrimitive.Root>

      {showCustom && (
        <button
          type="button"
          onClick={openCustomTime}
          disabled={isSearching}
          className={cn(
            "flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
            !isPreset
              ? "border-primary bg-brand-soft text-foreground"
              : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
          )}
        >
          <Settings2 className="size-4" aria-hidden="true" />
          {isPreset ? (
            "Custom time"
          ) : (
            <>
              Custom ·{" "}
              <span className="tabular-nums">
                {formatTimeControl(timeControl.time, timeControl.increment)}
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
