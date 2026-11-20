import { useCallback } from "react";
import { useChallenges } from "@/features/notifications/context/ChallengesContext";
import { formatTimeControl } from "@/utils/timeControl";
import { planQuickChallenge, quickChallengeSummary } from "../utils/challengePlan";
import { useLastChallenge } from "../utils/lastChallenge";

/**
 * Challenging a friend in one tap, on the terms of the last challenge you
 * sent. `terms` is null before the first one: there is nothing to repeat
 * yet, so the friend's Challenge button opens the form instead.
 */
export const useQuickChallenge = () => {
  const terms = useLastChallenge();
  const { sendChallenge, outgoingChallenge } = useChallenges();

  const send = useCallback(
    (friend: { id: number; username: string }) => {
      if (!terms) return;
      sendChallenge(planQuickChallenge(friend.id, terms), { username: friend.username });
    },
    [sendChallenge, terms]
  );

  return {
    terms,
    /** "5+0": what the button says it sends */
    label: terms ? formatTimeControl(terms.time, terms.increment) : null,
    /** "5+0 · Rated · Random colors" */
    summary: terms ? quickChallengeSummary(terms) : null,
    send,
    /** The friend whose answer we're waiting on, if any */
    waitingForId: outgoingChallenge?.challengedId ?? null,
  };
};
