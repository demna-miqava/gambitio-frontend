import { useEffect, useState } from "react";
import { useChallenges } from "@/features/notifications/context/ChallengesContext";
import { useIncomingChallenges } from "@/features/notifications/hooks/useIncomingChallenges";
import { describeChallengeColor } from "@/features/notifications/utils/challengeLabels";
import { UserAvatar } from "@/components/UserAvatar";
import { formatTimeControl } from "@/utils/timeControl";
import { formatDistance } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const REFRESH_MS = 30_000;

/** Re-renders every interval so relative times ("2 minutes ago") stay current. */
const useNow = (intervalMs: number, enabled: boolean) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, intervalMs]);
  return now;
};

interface ChallengesProps {
  /** Replaces the default top rule and spacing (e.g. a card on Home) */
  className?: string;
}

/**
 * Open challenges other players sent you, with Accept / Decline. Renders
 * nothing while there are none. Shared by Play and Home.
 */
export const Challenges = ({ className }: ChallengesProps) => {
  const { data: challenges = [], isLoading } = useIncomingChallenges();
  const { handleAcceptChallenge, handleDeclineChallenge } = useChallenges();
  const now = useNow(REFRESH_MS, challenges.length > 0);

  if (isLoading || challenges.length === 0) {
    return null;
  }
  return (
    <section
      aria-labelledby="incoming-challenges-title"
      className={cn("space-y-3", className ?? "border-t border-border/70 pt-5")}
    >
      <h2
        id="incoming-challenges-title"
        className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
      >
        Challenges for you
      </h2>
      <ul className="space-y-3">
        {challenges.map((challenge) => (
          <li
            key={challenge.id}
            className="flex flex-col gap-3 rounded-xl border border-border/70 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-3">
              <UserAvatar
                src={challenge.avatarUrl}
                username={challenge.username}
                className="size-9 shrink-0"
              />
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold">
                  {challenge.username}
                  {challenge.rating != null && (
                    <span className="font-normal text-muted-foreground tabular-nums">
                      {" "}
                      ({challenge.rating})
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="tabular-nums">
                    {formatTimeControl(challenge.time, challenge.increment)}
                  </span>
                  {" · "}
                  {describeChallengeColor(challenge.color)}
                  {" · "}
                  {formatDistance(new Date(challenge.createdAt), now, {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-2">
              <Button size="md"
                variant="outline"
                onClick={() => handleDeclineChallenge(challenge.challengerId)}
                aria-label={`Decline ${challenge.username}'s challenge`}
              >
                Decline
              </Button>
              <Button size="md"
                onClick={() => handleAcceptChallenge(challenge.challengerId)}
                aria-label={`Accept ${challenge.username}'s challenge`}
              >
                Accept
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
