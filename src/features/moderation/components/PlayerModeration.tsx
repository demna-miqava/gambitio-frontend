import { useState } from "react";
import { Ban, CircleCheck, Flag, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useBlockUser, useIsBlocked, useUnblockUser } from "../hooks/useBlocks";
import { ReportDialog } from "./ReportDialog";

export type ModerationAction = "block" | "report";

interface ModerationPlayer {
  id: number;
  username: string;
}

interface ModerationMenuProps {
  player: ModerationPlayer;
  /** Block (asks first) or report: the caller opens the dialog, see ModerationDialogs */
  onAction: (action: ModerationAction) => void;
  size?: "icon" | "md";
}

/**
 * The "more" menu on another player: block or unblock them, or report them.
 * Unblocking happens at once; blocking and reporting open a dialog, which
 * the caller renders (a menu inside a popover can't own one: the popover
 * closes, and takes the dialog with it).
 */
export const ModerationMenu = ({ player, onAction, size = "icon" }: ModerationMenuProps) => {
  const isBlocked = useIsBlocked(player.id);
  const unblock = useUnblockUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={size === "icon" ? "ghost" : "outline"}
          size={size === "icon" ? "icon" : "md"}
          // On a profile the actions share the row equally on phones; this one stays its own width
          className={size === "icon" ? "shrink-0 text-muted-foreground" : "flex-none! px-3"}
          aria-label={`More actions for ${player.username}`}
        >
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isBlocked ? (
          <DropdownMenuItem disabled={unblock.isPending} onSelect={() => unblock.mutate(player)}>
            <CircleCheck aria-hidden="true" /> Unblock
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => onAction("block")}>
            <Ban aria-hidden="true" /> Block
          </DropdownMenuItem>
        )}
        <DropdownMenuItem variant="destructive" onSelect={() => onAction("report")}>
          <Flag aria-hidden="true" /> Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface ModerationDialogsProps {
  player: ModerationPlayer;
  /** Which dialog is open */
  action: ModerationAction | null;
  onClose: () => void;
  /** The game between the viewer and this player, to send with a report */
  gameId?: number;
}

/** The dialogs ModerationMenu asks for. Render them outside any popover. */
export const ModerationDialogs = ({ player, action, onClose, gameId }: ModerationDialogsProps) => {
  const block = useBlockUser();
  return (
    <>
      <ConfirmDialog
        open={action === "block"}
        onOpenChange={(open) => !open && onClose()}
        title={`Block ${player.username}?`}
        description={
          <>
            You won't be paired with each other, and neither of you can challenge, befriend or chat
            with the other. A friendship between you ends. {player.username} isn't told, and you can
            unblock them in Settings.
          </>
        }
        confirmLabel="Block"
        destructive
        isPending={block.isPending}
        onConfirm={() => block.mutate(player, { onSuccess: onClose })}
      />
      <ReportDialog
        player={player}
        open={action === "report"}
        onOpenChange={(open) => !open && onClose()}
        {...(gameId !== undefined && { gameId })}
      />
    </>
  );
};

/** The menu with its dialogs, for places that aren't inside a popover. */
export const PlayerModeration = ({
  player,
  gameId,
  size,
}: {
  player: ModerationPlayer;
  gameId?: number;
  size?: "icon" | "md";
}) => {
  const [action, setAction] = useState<ModerationAction | null>(null);
  return (
    <>
      <ModerationMenu player={player} onAction={setAction} {...(size && { size })} />
      <ModerationDialogs
        player={player}
        action={action}
        onClose={() => setAction(null)}
        {...(gameId !== undefined && { gameId })}
      />
    </>
  );
};
