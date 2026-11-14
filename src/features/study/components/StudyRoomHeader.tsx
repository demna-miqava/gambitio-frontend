import { useId, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Eraser, FlipVertical2, LogOut, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ROUTES } from "@/constants/routes";
import { QKEY_STUDY_ROOMS } from "@/constants/queryKeys";
import { deleteStudyRoom, removeStudyMember, renameStudyRoom } from "@/services/study";
import { cn } from "@/lib/utils";
import { apiErrorMessage } from "../utils/studyState";

interface StudyRoomHeaderProps {
  roomId: number;
  name: string;
  isOwner: boolean;
  myId: number;
  connected: boolean;
  onCopyPgn: () => void;
  onFlip: () => void;
  onClearShapes: () => void;
  canClearShapes: boolean;
  /**
   * Called before leaving or deleting, so the room's own notice is expected
   * (and with false if that failed)
   */
  onExit: (expected?: boolean) => void;
  className?: string;
}

/** Room name with its actions: copy PGN, flip, clear arrows, rename / delete (owner), leave. */
export const StudyRoomHeader = ({
  roomId,
  name,
  isOwner,
  myId,
  connected,
  onCopyPgn,
  onFlip,
  onClearShapes,
  canClearShapes,
  onExit,
  className,
}: StudyRoomHeaderProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const nameId = useId();
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(name);
  const [confirmingExit, setConfirmingExit] = useState(false);

  const rename = useMutation({
    mutationFn: (next: string) => renameStudyRoom(roomId, next),
    onSuccess: () => {
      setRenaming(false);
      void queryClient.invalidateQueries({ queryKey: [QKEY_STUDY_ROOMS] });
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Couldn't rename the room")),
  });

  const exit = useMutation({
    mutationFn: () => {
      onExit();
      return isOwner ? deleteStudyRoom(roomId) : removeStudyMember(roomId, myId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QKEY_STUDY_ROOMS] });
      toast.success(isOwner ? "Room deleted" : "You left the room");
      navigate(ROUTES.STUDY, { replace: true });
    },
    onError: (error) => {
      onExit(false);
      toast.error(apiErrorMessage(error, "Something went wrong. Try again."));
    },
  });

  const submitRename = (event: FormEvent) => {
    event.preventDefault();
    const next = draft.trim();
    if (!next || next === name) return setRenaming(false);
    rename.mutate(next);
  };

  return (
    <div className={cn("flex min-h-13 shrink-0 items-center gap-1 lg:border-b lg:border-border/70 lg:pr-3 lg:pl-4", className)}>
      <div className="mr-auto min-w-0">
        <h2 className="truncate text-sm font-semibold text-foreground">{name}</h2>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
          <span
            aria-hidden="true"
            className={cn("size-1.5 rounded-full", connected ? "bg-emerald-500" : "bg-amber-500")}
          />
          {connected ? "Live" : "Reconnecting…"}
        </p>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onCopyPgn} aria-label="Copy PGN" className="text-muted-foreground hover:text-foreground">
            <Copy aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={4}>
          Copy PGN with variations and comments
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onFlip} aria-label="Flip board" className="text-muted-foreground hover:text-foreground">
            <FlipVertical2 aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={4}>
          Flip board (only for you)
        </TooltipContent>
      </Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="More room actions"
            className="text-muted-foreground hover:text-foreground data-[state=open]:bg-accent"
          >
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={onClearShapes} disabled={!canClearShapes}>
            <Eraser /> Clear arrows here
          </DropdownMenuItem>
          {isOwner && (
            <DropdownMenuItem
              onSelect={() => {
                setDraft(name);
                setRenaming(true);
              }}
            >
              <Pencil /> Rename room
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmingExit(true)}>
            {isOwner ? (
              <>
                <Trash2 /> Delete room
              </>
            ) : (
              <>
                <LogOut /> Leave room
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renaming} onOpenChange={setRenaming}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={submitRename} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Rename room</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor={nameId}>Name</Label>
              <Input id={nameId} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={80} autoFocus />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setRenaming(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={rename.isPending || !draft.trim()}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmingExit}
        onOpenChange={setConfirmingExit}
        title={isOwner ? `Delete “${name}”?` : `Leave “${name}”?`}
        description={
          isOwner
            ? "The analysis is deleted for everyone in the room. This can't be undone."
            : "You can come back only if someone in the room invites you again."
        }
        confirmLabel={isOwner ? "Delete" : "Leave"}
        destructive
        isPending={exit.isPending}
        onConfirm={() => exit.mutate()}
      />
    </div>
  );
};
