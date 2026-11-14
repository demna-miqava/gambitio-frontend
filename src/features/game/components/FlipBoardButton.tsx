import { FlipVertical2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FlipBoardButtonProps {
  onFlip: () => void;
  /** The side at the bottom now, for screen readers */
  orientation?: "white" | "black";
  className?: string;
}

/**
 * Square button that turns the board around, sized like the move
 * navigation buttons it usually sits beside. Pair it with useFlipBoardKey.
 */
export const FlipBoardButton = ({ onFlip, orientation, className }: FlipBoardButtonProps) => (
  <Button
    type="button"
    variant="secondary"
    size="icon-lg"
    onClick={onFlip}
    aria-label={orientation ? `Flip board (now ${orientation} at the bottom)` : "Flip board"}
    aria-keyshortcuts="F"
    title="Flip board (F)"
    className={cn("shrink-0 sm:size-10", className)}
  >
    <FlipVertical2 className="size-5" aria-hidden="true" />
  </Button>
);
