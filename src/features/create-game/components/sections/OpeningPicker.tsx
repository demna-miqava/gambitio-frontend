import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LiveGamePreview } from "@/features/watch/components/LiveGamePreview";
import { useStartingOpenings } from "@/features/openings/useStartingOpenings";
import {
  formatOpeningMoves,
  groupStartingOpenings,
  type StartingOpening,
} from "@/features/openings/startingOpenings";

/** The Select's value for the initial position (opening ids are never empty) */
const STANDARD = "standard";

interface OpeningPickerProps {
  /** The chosen opening's id; null for the initial position */
  value: string | null;
  onChange: (opening: StartingOpening | null) => void;
  /** Why the opening matters here, under the picker */
  hint?: string;
}

/**
 * The position a friend challenge starts from: the initial one, or a named
 * opening whose moves are played for both players. The board beside the
 * form shows the position; where that board is hidden (phones), a small one
 * here does.
 */
export const OpeningPicker = ({ value, onChange, hint }: OpeningPickerProps) => {
  const { data: openings, isPending, isError } = useStartingOpenings();
  const groups = useMemo(() => groupStartingOpenings(openings ?? []), [openings]);
  const selected = openings?.find((opening) => opening.id === value) ?? null;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="starting-position" className="min-w-0 shrink-0 font-normal text-muted-foreground">
          Starting position
        </Label>
        {isPending ? (
          <Skeleton className="h-11 w-52" />
        ) : (
          <Select
            value={selected?.id ?? STANDARD}
            onValueChange={(id) => onChange(openings?.find((opening) => opening.id === id) ?? null)}
            disabled={isError}
          >
            <SelectTrigger id="starting-position" className="h-11 w-52 min-w-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value={STANDARD}>Standard position</SelectItem>
              {groups.map((group) => (
                <SelectGroup key={group.label}>
                  <SelectSeparator />
                  <SelectLabel>{group.label}</SelectLabel>
                  {group.openings.map((opening) => (
                    <SelectItem key={opening.id} value={opening.id}>
                      {opening.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {isError && (
        <p className="text-xs text-muted-foreground">
          Couldn't load the openings. The game starts from the standard position.
        </p>
      )}
      {selected && (
        <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
          <div className="decorative-board-fallback w-20 shrink-0">
            <LiveGamePreview fen={selected.fen} />
          </div>
          <div className="min-w-0 leading-snug">
            <p className="text-sm">
              <span className="text-muted-foreground tabular-nums">{selected.eco}</span>{" "}
              {selected.name}
            </p>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {formatOpeningMoves(selected.moves)}
            </p>
          </div>
        </div>
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </section>
  );
};
