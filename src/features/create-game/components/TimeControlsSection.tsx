import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { PLAY_TIME_CONTROLS } from "../constants/timeControls";
import { useGameSetup } from "../GameSetupContext";
import { formatTimeControl } from "@/utils/timeControl";
import { cn } from "@/lib/utils";

interface TimeControlsSectionProps {
  /** Shows a "Custom" tile that opens the custom picker */
  showCustom?: boolean;
  /** Replaces opening the custom picker step, e.g. to show it inline */
  onCustom?: () => void;
  /** The inline custom picker `onCustom` toggles is open */
  isCustomOpen?: boolean;
}

const valueOf = (time: number, increment: number) => `${time}+${increment}`;

/**
 * All time controls visible at once, grouped by speed. One radio group: a
 * single Tab stop, arrow keys move between tiles.
 */
export const TimeControlsSection = ({
  showCustom = true,
  onCustom,
  isCustomOpen,
}: TimeControlsSectionProps) => {
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
        {PLAY_TIME_CONTROLS.map(({ label: format, options }) => (
          <div key={format} className="space-y-2">
            <p className="text-sm capitalize text-muted-foreground" aria-hidden="true">
              {format}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {options.map(({ label, time, increment }) => (
                <RadioGroupPrimitive.Item
                  key={valueOf(time, increment)}
                  value={valueOf(time, increment)}
                  aria-label={`${label} ${format}`}
                  className={cn(
                    "h-12 rounded-xl bg-background font-display-num text-xl text-foreground transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                    "hover:bg-accent",
                    "data-[state=checked]:bg-primary-solid data-[state=checked]:text-primary-solid-foreground",
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
          onClick={onCustom ?? openCustomTime}
          aria-expanded={onCustom ? isCustomOpen : undefined}
          disabled={isSearching}
          className={cn(
            "flex h-11 w-full items-center justify-center rounded-xl text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:pointer-events-none disabled:opacity-50",
            !isPreset
              ? "bg-primary-solid text-primary-solid-foreground"
              : "bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
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
