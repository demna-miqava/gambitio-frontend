import { useId, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { SegmentedRadioGroup, type SegmentedOption } from "@/components/SegmentedRadioGroup";
import { useOpening } from "@/features/openings";
import type { PlayerColor } from "@/features/game/types/game.types";
import { ROUTES } from "@/constants/routes";
import { useCreateLine } from "../hooks/useRepertoire";
import { fensAlong, formatMoves, lastMoverColor, MAX_LINE_NAME, MAX_LINE_PLIES } from "../utils/lines";
import { saveLineErrorMessage } from "../utils/errors";
import { MoveText } from "./MoveText";

export interface SaveToRepertoireDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The line in SAN, from the standard starting position */
  moves: string[];
  /** The colour the player plays it with; defaults to the side that made the last move */
  defaultColor?: PlayerColor;
}

const COLOR_OPTIONS: SegmentedOption<PlayerColor>[] = [
  { value: "white", label: "White" },
  { value: "black", label: "Black" },
];

/** A name for the line: the opening's, else its first moves. */
const suggestName = (openingName: string | undefined, moves: readonly string[]) =>
  (openingName ?? formatMoves(moves.slice(0, 6))).slice(0, MAX_LINE_NAME);

const SaveLineForm = ({
  moves,
  defaultColor,
  onDone,
}: Omit<SaveToRepertoireDialogProps, "open" | "onOpenChange"> & { onDone: () => void }) => {
  const navigate = useNavigate();
  const nameId = useId();
  const errorId = useId();
  const fens = useMemo(() => fensAlong(moves), [moves]);
  const opening = useOpening(fens);
  const [color, setColor] = useState<PlayerColor>(defaultColor ?? lastMoverColor(moves));
  // Null until the player types: the suggestion follows the opening name,
  // which loads a moment after the dialog opens
  const [typedName, setTypedName] = useState<string | null>(null);
  const name = typedName ?? suggestName(opening?.name, moves);
  const create = useCreateLine();

  const tooLong = moves.length > MAX_LINE_PLIES;
  const canSave = moves.length > 0 && !tooLong && name.trim().length > 0 && !create.isPending;

  const save = () => {
    if (!canSave) return;
    create.mutate(
      { color, name: name.trim(), moves },
      {
        onSuccess: (line) => {
          onDone();
          toast.success(`Saved “${line.name}” to your ${line.color} repertoire`, {
            action: { label: "View", onClick: () => navigate(ROUTES.REPERTOIRE) },
          });
        },
      }
    );
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
      className="space-y-5"
    >
      <DialogHeader>
        <DialogTitle>Save to repertoire</DialogTitle>
        <DialogDescription>
          Keep this line in your opening preparation, then practise it and see where your games leave it.
        </DialogDescription>
      </DialogHeader>

      {moves.length === 0 ? (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          Play some moves from the starting position first.
        </p>
      ) : (
        <div className="max-h-32 overflow-y-auto rounded-lg bg-muted/60 px-3 py-2">
          <MoveText moves={moves} />
        </div>
      )}
      {tooLong && (
        <p className="text-sm text-destructive">
          Lines can be at most {MAX_LINE_PLIES} moves (half-moves) long. Go back a few moves and try again.
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor={nameId}>Name</Label>
        <Input
          id={nameId}
          value={name}
          maxLength={MAX_LINE_NAME}
          onChange={(event) => setTypedName(event.target.value)}
          aria-invalid={name.trim().length === 0 || undefined}
        />
      </div>

      <div className="space-y-2">
        <p aria-hidden="true" className="text-sm font-medium">
          I play this with
        </p>
        <SegmentedRadioGroup label="I play this with" value={color} onValueChange={setColor} options={COLOR_OPTIONS} />
      </div>

      {create.isError && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {saveLineErrorMessage(create.error)}
        </p>
      )}

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSave} aria-describedby={create.isError ? errorId : undefined}>
          {create.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          Save line
        </Button>
      </DialogFooter>
    </form>
  );
};

/**
 * Saves a line (SAN from the starting position) to the signed-in player's
 * opening repertoire. The form resets each time the dialog opens.
 */
export const SaveToRepertoireDialog = ({ open, onOpenChange, moves, defaultColor }: SaveToRepertoireDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      {open && (
        <SaveLineForm
          moves={moves}
          {...(defaultColor && { defaultColor })}
          onDone={() => onOpenChange(false)}
        />
      )}
    </DialogContent>
  </Dialog>
);
