import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChallenges } from "@/features/notifications/context/ChallengesContext";
import {
  describeChallengeColor,
  describeChallengeTime,
  describeMatchFormat,
} from "@/features/notifications/utils/challengeLabels";
import { cn } from "@/lib/utils";

/**
 * "Waiting for {friend}…" with a Cancel button, shown while a challenge we
 * sent is open. Renders nothing when there is none.
 */
export const OutgoingChallengeCard = ({ className }: { className?: string }) => {
  const { outgoingChallenge, cancelChallenge } = useChallenges();
  if (!outgoingChallenge) return null;
  const { username, color, bestOf, seriesGame } = outgoingChallenge;
  const format = describeMatchFormat(bestOf, seriesGame);

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-xl bg-card px-4 py-8 text-center",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
      <div className="min-w-0 max-w-full">
        <p className="truncate font-medium">Waiting for {username}…</p>
        <p className="text-sm text-muted-foreground">
          {format && `${format} · `}
          <span className="tabular-nums">{describeChallengeTime(outgoingChallenge, username)}</span>
          {" · "}
          {describeChallengeColor(color)}
        </p>
      </div>
      <Button size="lg" variant="outline" onClick={cancelChallenge}>
        Cancel challenge
      </Button>
    </div>
  );
};
