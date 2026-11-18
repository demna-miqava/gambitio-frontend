import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useChallenges } from "@/features/notifications/context/ChallengesContext";
import { useIncomingChallenges } from "@/features/notifications/hooks/useIncomingChallenges";
import { describeChallengeTerms } from "@/features/notifications/utils/challengeLabels";
import { INCOMING_LIST_ATTR } from "@/features/notifications/utils/incomingList";
import { challengeToastId } from "@/features/notifications/hooks/useManageChallenge";
import { UserAvatar } from "@/components/UserAvatar";
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
  // In view, the list closes the toasts for the challenges it shows: the
  // same challenge twice, the toast on top of its own entry on a phone
  const sectionRef = useRef<HTMLElement>(null);
  const challengerKey = challenges.map((c) => c.challengerId).join(",");
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !challengerKey) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      for (const id of challengerKey.split(",")) toast.dismiss(challengeToastId(Number(id)));
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, [challengerKey]);

  if (isLoading || challenges.length === 0) {
    return null;
  }
  return (
    <section
      ref={sectionRef}
      {...{ [INCOMING_LIST_ATTR]: "" }}
      aria-labelledby="incoming-challenges-title"
      className={cn("space-y-3", className ?? "border-t border-border pt-5")}
    >
      <h2
        id="incoming-challenges-title"
        className="text-sm text-muted-foreground"
      >
        Challenges for you
      </h2>
      <ul className="space-y-3">
        {challenges.map((challenge) => {
          const terms = describeChallengeTerms(challenge, challenge.username);
          return (
          <li
            key={challenge.id}
            className="flex flex-col gap-3 rounded-xl bg-card px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-3">
              <UserAvatar
                src={challenge.avatarUrl}
                username={challenge.username}
                className="size-9 shrink-0"
              />
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-medium">
                  {challenge.username}
                  {challenge.rating != null && (
                    <span className="font-normal text-muted-foreground tabular-nums">
                      {" "}
                      ({challenge.rating})
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {terms.format && `${terms.format} · `}
                  <span className="tabular-nums">{terms.time}</span>
                  {terms.unrated && " · Unrated"}
                  {" · "}
                  {terms.color}
                  {" · "}
                  {/* `now` ticks every 30 s: a newer challenge isn't "in" the future */}
                  {formatDistance(Math.min(new Date(challenge.createdAt).getTime(), now), now, {
                    addSuffix: true,
                  })}
                </p>
                {terms.opening && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{terms.opening}</p>
                )}
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
                onClick={() => handleAcceptChallenge(challenge)}
                aria-label={`Accept ${challenge.username}'s challenge`}
              >
                Accept
              </Button>
            </div>
          </li>
          );
        })}
      </ul>
    </section>
  );
};
