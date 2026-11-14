import { useId, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QKEY_STUDY_ROOMS } from "@/constants/queryKeys";
import { getStudyRoomRoute } from "@/constants/routes";
import { createStudyRoom } from "@/services/study";
import { apiErrorCode, apiErrorMessage } from "../utils/studyState";
import { MAX_START_MOVES, parseStartInput } from "../utils/startInput";

export interface CreateStudyRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Moves in SAN from the start (or from initialFen), e.g. the game being analyzed */
  initialMoves?: string[];
  /** Starting position; the standard one when left out */
  initialFen?: string;
  defaultName?: string;
}

const MAX_NAME_LENGTH = 80;

const ERROR_TEXT: Record<string, string> = {
  TOO_MANY_ROOMS: "You already own 30 study rooms. Delete one you no longer need, then try again.",
  INVALID_STUDY_ACTION: "The starting position or moves aren't valid.",
};

/**
 * Creates a study room and opens it. Started from a game or an analysis
 * (initialMoves / initialFen) it takes those moves; started empty it can
 * take a pasted PGN or FEN instead.
 */
export const CreateStudyRoomDialog = ({
  open,
  onOpenChange,
  initialMoves,
  initialFen,
  defaultName = "",
}: CreateStudyRoomDialogProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const nameId = useId();
  const startId = useId();
  const errorId = useId();
  const [name, setName] = useState(defaultName);
  const [start, setStart] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const hasInitialLine = (initialMoves?.length ?? 0) > 0 || !!initialFen;

  const create = useMutation({
    mutationFn: createStudyRoom,
    onSuccess: (room) => {
      void queryClient.invalidateQueries({ queryKey: [QKEY_STUDY_ROOMS] });
      onOpenChange(false);
      navigate(getStudyRoomRoute(room.id));
    },
  });

  // Fresh fields each time it opens (the parent opens it)
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(defaultName);
      setStart("");
      setInputError(null);
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) create.reset();
    onOpenChange(next);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setInputError("Give the room a name.");
      return;
    }
    let fen = initialFen;
    let moves = initialMoves;
    if (!hasInitialLine) {
      const parsed = parseStartInput(start);
      if (!parsed.ok) {
        setInputError(parsed.message);
        return;
      }
      ({ fen, moves } = parsed);
    } else if ((moves?.length ?? 0) > MAX_START_MOVES) {
      // The server refuses longer lines (e.g. a very long game)
      setInputError(`A room can start with at most ${MAX_START_MOVES} moves.`);
      return;
    }
    setInputError(null);
    create.mutate({
      name: trimmed,
      ...(fen && { fen }),
      ...(moves && moves.length > 0 && { moves }),
    });
  };

  const serverError = create.isError
    ? (ERROR_TEXT[apiErrorCode(create.error) ?? ""] ??
      apiErrorMessage(create.error, "Couldn't create the room. Try again."))
    : null;
  const error = inputError ?? serverError;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
          <DialogHeader>
            <DialogTitle>New study room</DialogTitle>
            <DialogDescription>
              {hasInitialLine
                ? `Starts with ${initialMoves?.length ? `these ${initialMoves.length} moves` : "this position"}. Invite friends once it's open.`
                : "Explore a board together with friends: moves, arrows and comments are shared live."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor={nameId}>Name</Label>
            <Input
              id={nameId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={MAX_NAME_LENGTH}
              placeholder="e.g. Sicilian prep"
              autoComplete="off"
              autoFocus
              aria-invalid={inputError === "Give the room a name." || undefined}
              aria-describedby={error ? errorId : undefined}
            />
          </div>

          {!hasInitialLine && (
            <div className="space-y-2">
              <Label htmlFor={startId}>
                Start from <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id={startId}
                value={start}
                onChange={(e) => setStart(e.target.value)}
                placeholder="Paste a PGN, a list of moves (1. e4 e5 2. Nf3) or a FEN"
                className="max-h-40 min-h-20 font-mono text-xs"
                spellCheck={false}
                aria-describedby={error ? errorId : undefined}
              />
              <p className="text-xs text-muted-foreground">
                Leave it empty to start from the initial position.
              </p>
            </div>
          )}

          {error && (
            <p id={errorId} role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              Create room
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
