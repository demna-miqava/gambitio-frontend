import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type GameResultDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
};

/**
 * The result, shown when the game ends here. Non-modal (no dimmed backdrop),
 * so the final position stays visible; Escape, the close button or a click
 * outside closes it, and the same actions stay in the side panel. On phones
 * it's a sheet along the bottom edge, below the board's top half.
 */
const GameResultDialog = ({
  open,
  onOpenChange,
  title = "Game over",
  description,
  children,
}: GameResultDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent
        showCloseButton
        className={cn(
          "gap-5 border-border/70 p-6 shadow-2xl",
          // Phones: bottom sheet
          "top-auto bottom-0 left-0 max-w-none translate-x-0 translate-y-0 rounded-none rounded-t-2xl pb-[calc(1.5rem+env(safe-area-inset-bottom))]",
          // Larger screens: small centered card
          "sm:top-[50%] sm:bottom-auto sm:left-[50%] sm:w-[min(360px,calc(100%-2rem))] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl sm:pb-6"
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-center font-display text-2xl font-semibold">
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="text-center">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        {children}
      </DialogContent>
    </Dialog>
  );
};

export default GameResultDialog;
