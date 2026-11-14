import { useId, useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { SegmentedRadioGroup, type SegmentedOption } from "@/components/SegmentedRadioGroup";
import { useOpening } from "@/features/openings";
import type { PlayerColor } from "@/features/game/types/game.types";
import { useCreateLine } from "../hooks/useRepertoire";
import { fensAlong, formatMoves, MAX_LINE_NAME, parseMoveText } from "../utils/lines";
import { saveLineErrorMessage } from "../utils/errors";
import { MoveText } from "./MoveText";

const COLOR_OPTIONS: SegmentedOption<PlayerColor>[] = [
  { value: "white", label: "White" },
  { value: "black", label: "Black" },
];

const AddLineForm = ({ defaultColor, onDone }: { defaultColor: PlayerColor; onDone: () => void }) => {
  const movesId = useId();
  const movesHintId = useId();
  const nameId = useId();
  const [text, setText] = useState("");
  const [color, setColor] = useState<PlayerColor>(defaultColor);
  const [typedName, setTypedName] = useState<string | null>(null);
  const parsed = useMemo(() => (text.trim() ? parseMoveText(text) : null), [text]);
  const moves = useMemo(() => (parsed?.ok ? parsed.moves : []), [parsed]);
  const fens = useMemo(() => fensAlong(moves), [moves]);
  const opening = useOpening(fens);
  const name = typedName ?? (moves.length > 0 ? (opening?.name ?? formatMoves(moves.slice(0, 6))).slice(0, MAX_LINE_NAME) : "");
  const create = useCreateLine();
  const canSave = parsed?.ok === true && name.trim().length > 0 && !create.isPending;

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave) return;
        create.mutate(
          { color, name: name.trim(), moves },
          {
            onSuccess: (line) => {
              toast.success(`Added “${line.name}”`);
              onDone();
            },
          }
        );
      }}
    >
      <DialogHeader>
        <DialogTitle>Add a line</DialogTitle>
        <DialogDescription>
          Type or paste the moves from the starting position, e.g. “1. e4 e5 2. Nf3 Nc6 3. Bb5”.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor={movesId}>Moves</Label>
        <Textarea
          id={movesId}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="1. e4 e5 2. Nf3 Nc6"
          aria-describedby={movesHintId}
          aria-invalid={parsed?.ok === false || undefined}
          rows={3}
          autoFocus
        />
        <div id={movesHintId} aria-live="polite">
          {parsed?.ok === false ? (
            <p className="text-sm text-destructive">{parsed.message}</p>
          ) : moves.length > 0 ? (
            <MoveText moves={moves} className="text-muted-foreground" />
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={nameId}>Name</Label>
        <Input
          id={nameId}
          value={name}
          maxLength={MAX_LINE_NAME}
          onChange={(event) => setTypedName(event.target.value)}
          placeholder="e.g. Ruy Lopez, main line"
        />
      </div>

      <div className="space-y-2">
        <p aria-hidden="true" className="text-sm font-medium">
          I play this with
        </p>
        <SegmentedRadioGroup label="I play this with" value={color} onValueChange={setColor} options={COLOR_OPTIONS} />
      </div>

      {create.isError && (
        <p role="alert" className="text-sm text-destructive">
          {saveLineErrorMessage(create.error)}
        </p>
      )}

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSave}>
          {create.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          Add line
        </Button>
      </DialogFooter>
    </form>
  );
};

/** Adds a line typed as moves (checked as you type; the server checks again). */
export const AddLineDialog = ({
  open,
  onOpenChange,
  defaultColor,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultColor: PlayerColor;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      {open && <AddLineForm defaultColor={defaultColor} onDone={() => onOpenChange(false)} />}
    </DialogContent>
  </Dialog>
);
