import type { Blocker } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LeaveGameDialogProps {
  /** From useLeaveGuard */
  blocker: Blocker;
  /** What happens to the game, e.g. "Your clock keeps running." */
  description: string;
}

/** Asks before leaving a game in progress. Pair with useLeaveGuard. */
export const LeaveGameDialog = ({ blocker, description }: LeaveGameDialogProps) => {
  const open = blocker.state === "blocked";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && blocker.state === "blocked") blocker.reset();
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Leave the game?</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => blocker.state === "blocked" && blocker.reset()}
          >
            Stay
          </Button>
          <Button
            variant="destructive"
            onClick={() => blocker.state === "blocked" && blocker.proceed()}
          >
            Leave
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
