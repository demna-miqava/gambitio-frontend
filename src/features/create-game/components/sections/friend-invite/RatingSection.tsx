import { SegmentedRadioGroup, type SegmentedOption } from "@/components/SegmentedRadioGroup";
import { ratingHint, type ChallengePlan, type Rating } from "../../../utils/challengePlan";

const RATING_CHOICES: SegmentedOption<Rating>[] = [
  { value: "rated", label: "Rated" },
  { value: "unrated", label: "Unrated" },
];

interface RatingSectionProps {
  plan: ChallengePlan;
  rating: Rating;
  onRatingChange: (rating: Rating) => void;
}

/**
 * Rated or unrated, with what that means. Nothing with time odds (their
 * section says they're unrated); with an opening outside a mirror match the
 * choice is locked on Unrated, and the line under it says why.
 */
export const RatingSection = ({ plan, rating, onRatingChange }: RatingSectionProps) => {
  if (plan.forcedUnrated === "odds") return null;
  const locked = plan.forcedUnrated === "opening";
  const hint = ratingHint(plan);
  return (
    <section className="space-y-2">
      <p aria-hidden="true" className="text-sm text-muted-foreground">
        Rating
      </p>
      <SegmentedRadioGroup
        label="Rating"
        value={locked ? "unrated" : rating}
        onValueChange={onRatingChange}
        options={RATING_CHOICES}
        disabled={locked}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </section>
  );
};
