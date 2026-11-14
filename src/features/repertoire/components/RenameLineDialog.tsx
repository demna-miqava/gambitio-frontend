import { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/utils";
import type { RepertoireLine } from "@/services/repertoire";
import { useUpdateLine } from "../hooks/useRepertoire";
import { MAX_LINE_NAME } from "../utils/lines";

const RenameForm = ({ line, onDone }: { line: RepertoireLine; onDone: () => void }) => {
  const id = useId();
  const [name, setName] = useState(line.name);
  const update = useUpdateLine();
  const trimmed = name.trim();

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!trimmed || trimmed === line.name) return onDone();
        update.mutate({ id: line.id, name: trimmed }, { onSuccess: onDone });
      }}
    >
      <DialogHeader>
        <DialogTitle>Rename line</DialogTitle>
      </DialogHeader>
      <div className="space-y-2">
        <Label htmlFor={id}>Name</Label>
        <Input id={id} value={name} maxLength={MAX_LINE_NAME} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      {update.isError && (
        <p role="alert" className="text-sm text-destructive">
          {getApiErrorMessage(update.error, "Couldn't rename the line. Try again.")}
        </p>
      )}
      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={!trimmed || update.isPending}>
          {update.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          Save
        </Button>
      </DialogFooter>
    </form>
  );
};

export const RenameLineDialog = ({
  line,
  onOpenChange,
}: {
  /** The line being renamed; null closes the dialog */
  line: RepertoireLine | null;
  onOpenChange: (open: boolean) => void;
}) => (
  <Dialog open={line !== null} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-sm">
      {line && <RenameForm line={line} onDone={() => onOpenChange(false)} />}
    </DialogContent>
  </Dialog>
);
