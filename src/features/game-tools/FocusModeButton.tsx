import { Focus, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FocusModeButtonProps {
  active: boolean;
  onToggle: () => void;
  className?: string;
}

/** Turns focus mode on, or back off (see useFocusMode). */
export const FocusModeButton = ({ active, onToggle, className }: FocusModeButtonProps) => {
  const Icon = active ? Minimize2 : Focus;
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-pressed={active}
      aria-label="Focus mode"
      aria-keyshortcuts="Z"
      title={active ? "Leave focus mode (Z)" : "Focus mode: just the board and clocks (Z)"}
      onClick={onToggle}
      className={cn(active && "text-primary", className)}
    >
      <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
    </Button>
  );
};
