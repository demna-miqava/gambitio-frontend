import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SegmentedRadioGroup, type SegmentedOption } from "@/components/SegmentedRadioGroup";
import { formatClock } from "@/utils/timeControl";
import type { ChallengePlan, TimeOdds } from "../../../utils/challengePlan";

const ODDS_CHOICES: SegmentedOption<TimeOdds>[] = [
  { value: "even", label: "Even" },
  { value: "me", label: "Less for me" },
  { value: "them", label: "Less for them" },
];

interface TimeOddsSectionProps {
  plan: ChallengePlan;
  odds: TimeOdds;
  onOddsChange: (odds: TimeOdds) => void;
  onClockChange: (clock: number) => void;
  friendName: string;
}

/**
 * Time odds: one player keeps the time control's clock, the other gets a
 * shorter one. Nothing when no shorter clock exists (the shortest time controls).
 */
export const TimeOddsSection = ({
  plan,
  odds,
  onOddsChange,
  onClockChange,
  friendName,
}: TimeOddsSectionProps) => {
  if (plan.clockChoices.length === 0) return null;
  return (
    <section className="space-y-3">
      <div className="space-y-2">
        <p aria-hidden="true" className="text-sm text-muted-foreground">
          Time odds
        </p>
        <SegmentedRadioGroup label="Time odds" value={odds} onValueChange={onOddsChange} options={ODDS_CHOICES} />
      </div>
      {plan.hasOdds && (
        <>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="odds-clock" className="min-w-0 truncate">
              {odds === "me" ? "My clock" : `${friendName}'s clock`}
            </Label>
            <Select value={String(plan.shorterClock)} onValueChange={(v) => onClockChange(Number(v))}>
              <SelectTrigger id="odds-clock" className="h-11 w-32 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {plan.clockChoices.map((clock) => (
                  <SelectItem key={clock} value={String(clock)}>
                    {formatClock(clock)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            You start with {formatClock(plan.ownTime)}, {friendName} with {formatClock(plan.friendTime)}
            {plan.isMatch ? ", in every game" : ""}.
          </p>
        </>
      )}
    </section>
  );
};
