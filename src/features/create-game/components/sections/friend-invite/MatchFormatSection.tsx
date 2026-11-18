import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SegmentedRadioGroup, type SegmentedOption } from "@/components/SegmentedRadioGroup";
import { MATCH_MINUTES } from "@/features/series/utils/seriesFormat";
import { formatTimeControl } from "@/utils/timeControl";
import {
  formatHint,
  type ChallengePlan,
  type MatchFormat,
  type SeriesLength,
} from "../../../utils/challengePlan";

const FORMAT_CHOICES: SegmentedOption<MatchFormat>[] = [
  { value: "single", label: "Single" },
  { value: "mirror", label: "Mirror" },
  { value: "series", label: "Series" },
  { value: "timed", label: "Timed" },
];

const LENGTH_CHOICES: SegmentedOption<SeriesLength>[] = [
  { value: "3", label: "Best of 3" },
  { value: "5", label: "Best of 5" },
];

interface MatchFormatSectionProps {
  plan: ChallengePlan;
  format: MatchFormat;
  onFormatChange: (format: MatchFormat) => void;
  seriesLength: SeriesLength;
  onSeriesLengthChange: (length: SeriesLength) => void;
  onMatchMinutesChange: (minutes: number) => void;
  /** The time control, for the "doesn't fit" warning */
  time: number;
  increment: number;
}

/** Single game, mirror match, best-of series or timed match, with the length and how it's scored. */
export const MatchFormatSection = ({
  plan,
  format,
  onFormatChange,
  seriesLength,
  onSeriesLengthChange,
  onMatchMinutesChange,
  time,
  increment,
}: MatchFormatSectionProps) => {
  const hint = formatHint(plan.bestOf, plan.matchMinutes);
  return (
    <section className="space-y-2">
      <p aria-hidden="true" className="text-sm text-muted-foreground">
        Match format
      </p>
      <SegmentedRadioGroup label="Match format" value={format} onValueChange={onFormatChange} options={FORMAT_CHOICES} />
      {format === "series" && (
        <SegmentedRadioGroup
          label="Series length"
          value={seriesLength}
          onValueChange={onSeriesLengthChange}
          options={LENGTH_CHOICES}
        />
      )}
      {plan.matchMinutes !== null && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <Label htmlFor="match-minutes" className="min-w-0 truncate">
            Match length
          </Label>
          <Select value={String(plan.matchMinutes)} onValueChange={(v) => onMatchMinutesChange(Number(v))}>
            <SelectTrigger id="match-minutes" className="h-11 w-32 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MATCH_MINUTES.map((minutes) => (
                <SelectItem key={minutes} value={String(minutes)}>
                  {minutes} min
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {!plan.fitsMatch && (
        <p role="alert" className="text-xs font-medium text-destructive">
          A {formatTimeControl(time, increment)} game doesn't fit in {plan.matchMinutes} minutes. Pick a faster
          time control or a longer match.
        </p>
      )}
    </section>
  );
};
