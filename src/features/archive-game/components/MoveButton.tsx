import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { scrollIntoContainer } from "@/utils/scrollIntoContainer";

interface MoveButtonProps {
  move: string;
  /** Spoken label, e.g. "12. Nf3" */
  label: string;
  isActive: boolean;
  /** Variation moves are shown smaller and muted */
  isVariation?: boolean;
  onClick: () => void;
  /** Shown after the move, e.g. a review glyph ("??"); decorative */
  suffix?: ReactNode;
  /** Appended to the spoken label, e.g. "blunder" */
  description?: string;
}

export const MoveButton = ({
  move,
  label,
  isActive,
  isVariation = false,
  onClick,
  suffix,
  description,
}: MoveButtonProps) => {
  const ref = useRef<HTMLButtonElement>(null);

  // Keep the current move visible as you step through a long game
  useEffect(() => {
    if (isActive) scrollIntoContainer(ref.current);
  }, [isActive]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={description ? `${label}, ${description}` : label}
      aria-current={isActive ? "step" : undefined}
      // Same current-move style as the live game's list and the phone strip
      className={cn(
        "inline-flex items-center rounded-md text-left tabular-nums transition-colors",
        // Taller on phones (where this list is opened from the move strip)
        isVariation ? "min-h-8 px-1 py-0.5 text-xs lg:min-h-0" : "min-h-9 px-2 py-1 text-sm lg:min-h-8",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
        isActive
          ? "bg-brand-soft font-semibold text-foreground"
          : cn(
              "hover:bg-accent hover:text-foreground",
              isVariation ? "text-muted-foreground" : "text-foreground/85"
            )
      )}
    >
      {move}
      {suffix}
    </button>
  );
};
