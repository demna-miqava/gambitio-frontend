import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { SPEED_ICON, SPEED_LABEL } from "@/features/game/constants/speed";
import { ProvisionalMark } from "@/components/ProvisionalMark";
import { useUser } from "@/hooks/useUser";
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
  const { bulletRating, blitzRating, rapidRating, chessProfile } = useUser();
  const ratings = {
    bullet: { value: bulletRating, provisional: chessProfile?.bulletProvisional },
    blitz: { value: blitzRating, provisional: chessProfile?.blitzProvisional },
    rapid: { value: rapidRating, provisional: chessProfile?.rapidProvisional },
  };
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
        {PLAY_TIME_CONTROLS.map(({ label: format, options }) => {
          const Icon = SPEED_ICON[format];
          const rating = ratings[format];
          return (
          <div key={format} className="space-y-1.5">
            {/* The speed, and the player's rating in it at the end of the line */}
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground">
              <Icon className="size-[15px]" strokeWidth={2} aria-hidden="true" />
              <span aria-hidden="true">{SPEED_LABEL[format]}</span>
              {rating.value !== undefined && (
                <span className="ml-auto font-normal text-faint tabular-nums">
                  <span className="sr-only">Your {format} rating: </span>
                  {rating.value}
                  <ProvisionalMark provisional={rating.provisional} className="text-faint" />
                </span>
              )}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {options.map(({ label, time, increment }) => (
                <RadioGroupPrimitive.Item
                  key={valueOf(time, increment)}
                  value={valueOf(time, increment)}
                  aria-label={`${label} ${format}`}
                  className={cn(
                    "h-[50px] rounded-md bg-muted font-display-num text-xl text-foreground shadow-[inset_0_0_0_1px_var(--border)] transition-colors max-sm:h-14",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                    "hover:shadow-[inset_0_0_0_1px_var(--border-strong)]",
                    "data-[state=checked]:bg-primary-solid data-[state=checked]:text-primary-solid-foreground data-[state=checked]:shadow-none",
                    "disabled:pointer-events-none disabled:opacity-50"
                  )}
                >
                  {label}
                </RadioGroupPrimitive.Item>
              ))}
            </div>
          </div>
          );
        })}
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
