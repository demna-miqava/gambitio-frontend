import { Play, Trophy } from "lucide-react";
import { SegmentedRadioGroup } from "@/components/SegmentedRadioGroup";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { COORDINATE_SECONDS, type CoordinateOptions, type CoordinatePerspective } from "../types";
import { secondsLabel } from "../utils/coordinates";

const TIME_OPTIONS = COORDINATE_SECONDS.map((s) => ({ value: String(s), label: secondsLabel(s) }));
const SIDE_OPTIONS: { value: CoordinatePerspective; label: string }[] = [
  { value: "white", label: "White" },
  { value: "black", label: "Black" },
];
const PIECE_OPTIONS = [
  { value: "pieces", label: "Pieces" },
  { value: "empty", label: "Empty board" },
];

// The group itself carries the name for screen readers
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <p aria-hidden="true" className="text-xs font-medium text-muted-foreground">
      {label}
    </p>
    {children}
  </div>
);

/** The options before a run, the best for them, and Start. */
export const RunSetup = ({
  options,
  onChange,
  onStart,
  best,
  bestPending,
}: {
  options: CoordinateOptions;
  onChange: (change: Partial<CoordinateOptions>) => void;
  onStart: () => void;
  best: number | null;
  bestPending: boolean;
}) => (
  <div className="space-y-5">
    <Field label="Time">
      <SegmentedRadioGroup
        label="Time"
        value={String(options.seconds)}
        onValueChange={(v) => onChange({ seconds: Number(v) as CoordinateOptions["seconds"] })}
        options={TIME_OPTIONS}
      />
    </Field>
    <Field label="Board seen from">
      <SegmentedRadioGroup
        label="Board seen from"
        value={options.perspective}
        onValueChange={(perspective) => onChange({ perspective })}
        options={SIDE_OPTIONS}
      />
    </Field>
    <Field label="On the board">
      <SegmentedRadioGroup
        label="On the board"
        value={options.withPieces ? "pieces" : "empty"}
        onValueChange={(v) => onChange({ withPieces: v === "pieces" })}
        options={PIECE_OPTIONS}
      />
    </Field>

    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Trophy className="size-4" aria-hidden="true" />
      Personal best:{" "}
      {bestPending ? (
        <Skeleton className="inline-block h-4 w-6 align-middle" />
      ) : (
        <span className="font-medium tabular-nums text-foreground">{best ?? "none yet"}</span>
      )}
    </div>

    <Button size="lg" className="w-full" onClick={onStart}>
      <Play aria-hidden="true" /> Start
    </Button>
  </div>
);
