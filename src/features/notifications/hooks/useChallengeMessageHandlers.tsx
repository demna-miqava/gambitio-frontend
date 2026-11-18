import { useCallback, useEffect, useRef, type RefObject } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMessageDispatcher } from "@/hooks/useMessageDispatcher";
import { QKEY_CHALLENGES } from "@/constants/queryKeys";
import { NOTIFICATION_MESSAGE_TYPES } from "../constants/websocket-types";
import ChallengeNotification from "../components/ChallengeNotification";
import { getGameRoute } from "@/constants/routes";
import { notificationMessages } from "@/services/websocketMessageDispatcher";
import { challengeToastId } from "./useManageChallenge";
import { useIncomingChallenges } from "./useIncomingChallenges";
import type {
  NotificationWebSocketMessage,
  Challenge,
  ChallengeRef,
  OutgoingChallenge,
} from "../types/websocket-messages";

/** The server's answer to accepting a challenge whose terms changed since it was shown */
export const CHALLENGE_CHANGED = "CHALLENGE_CHANGED";

type Options = {
  handleAccept: (challenge: ChallengeRef) => void;
  handleDecline: (challengerId: number) => void;
  removeChallenge: (challengerId: number) => void;
  /** The challenge we're waiting on, read when a reply arrives */
  outgoingRef: RefObject<OutgoingChallenge | null>;
  clearOutgoing: () => void;
  /** Type of the last message we sent, to tell what an error refers to */
  lastSentTypeRef: RefObject<NOTIFICATION_MESSAGE_TYPES | null>;
};

/** Add a challenge, replacing an older one from the same challenger. */
export const upsertChallenge = (
  challenges: Challenge[],
  challenge: Challenge
): Challenge[] => [
  ...challenges.filter(
    (c) => c.id !== challenge.id && c.challengerId !== challenge.challengerId
  ),
  challenge,
];

/**
 * Hook for handling challenge-related WebSocket messages.
 * Manages toast notifications, query cache updates, and navigation.
 *
 * Incoming challenge toasts stay until the challenge is resolved: accepted,
 * declined, cancelled by the challenger, or gone from the challenges list
 * (which is refetched after every challenge message).
 */
export const useChallengeMessageHandlers = ({
  handleAccept,
  handleDecline,
  removeChallenge,
  outgoingRef,
  clearOutgoing,
  lastSentTypeRef,
}: Options) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: challenges } = useIncomingChallenges();
  // Challenger ids with a toast on screen
  const toastsShownRef = useRef(new Set<number>());

  const invalidateChallenges = useCallback(
    () => queryClient.invalidateQueries({ queryKey: [QKEY_CHALLENGES] }),
    [queryClient]
  );

  // Dismiss toasts for challenges that no longer exist (e.g. resolved while
  // the socket was reconnecting)
  useEffect(() => {
    if (!challenges) return;
    const open = new Set(challenges.map((c) => c.challengerId));
    for (const challengerId of toastsShownRef.current) {
      if (!open.has(challengerId)) {
        toast.dismiss(challengeToastId(challengerId));
        toastsShownRef.current.delete(challengerId);
      }
    }
  }, [challenges]);

  const handleChallengeReceived = useCallback(
    (message: NotificationWebSocketMessage) => {
      if (message.type !== NOTIFICATION_MESSAGE_TYPES.CHALLENGE_RECEIVED)
        return;
      const challenge: Challenge = {
        id: message.data.id,
        challengerId: message.data.challengerId,
        username: message.data.username,
        avatarUrl: message.data.avatarUrl || null,
        color: message.data.color,
        time: message.data.time,
        increment: message.data.increment,
        ownTime: message.data.ownTime ?? null,
        opponentTime: message.data.opponentTime ?? null,
        createdAt: message.data.createdAt,
        rating: message.data.rating,
        bestOf: message.data.bestOf,
        version: message.data.version,
      };

      queryClient.setQueryData<Challenge[]>([QKEY_CHALLENGES], (old = []) =>
        upsertChallenge(old, challenge)
      );
      invalidateChallenges();

      toastsShownRef.current.add(challenge.challengerId);
      // Same id per challenger, so a repeated message updates the toast
      toast(
        <ChallengeNotification
          challenge={challenge}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />,
        {
          id: challengeToastId(challenge.challengerId),
          duration: Infinity,
          onDismiss: () => toastsShownRef.current.delete(challenge.challengerId),
        }
      );
    },
    [handleAccept, handleDecline, invalidateChallenges, queryClient]
  );

  const handleChallengeCancelled = useCallback(
    (message: NotificationWebSocketMessage) => {
      if (message.type !== NOTIFICATION_MESSAGE_TYPES.CHALLENGE_CANCELLED)
        return;
      const { challengerId } = message.data;
      const challenge = queryClient
        .getQueryData<Challenge[]>([QKEY_CHALLENGES])
        ?.find((c) => c.challengerId === challengerId);
      const hadToast = toastsShownRef.current.has(challengerId);
      removeChallenge(challengerId);
      invalidateChallenges();
      // "declined": we declined it in another tab, nothing to tell
      if (challenge && hadToast && message.data.reason !== "declined") {
        toast.info(`${challenge.username} cancelled their challenge`);
      }
    },
    [invalidateChallenges, queryClient, removeChallenge]
  );

  const handleOpponentUnavailable = useCallback((message: NotificationWebSocketMessage) => {
    if (message.type !== NOTIFICATION_MESSAGE_TYPES.OPPONENT_UNAVAILABLE) return;
    const outgoing = outgoingRef.current;
    const request = message.data?.request;
    const answersSend = request?.type
      ? request.type === NOTIFICATION_MESSAGE_TYPES.CHALLENGE_SENT &&
        request.data?.challengedId === outgoing?.challengedId
      : lastSentTypeRef.current === NOTIFICATION_MESSAGE_TYPES.CHALLENGE_SENT;
    if (answersSend && outgoing) {
      clearOutgoing();
      toast.error(`${outgoing.username} is offline or in a game`, {
        id: "currently_unavailable",
      });
      return;
    }
    // Accepting failed: the challenger left or started another game
    invalidateChallenges();
    toast.error("That player is no longer available", {
      id: "currently_unavailable",
    });
  }, [clearOutgoing, invalidateChallenges, lastSentTypeRef, outgoingRef]);

  const handleChallengeDeclined = useCallback(
    (message: NotificationWebSocketMessage) => {
      if (message.type !== NOTIFICATION_MESSAGE_TYPES.CHALLENGE_DECLINED)
        return;
      const outgoing = outgoingRef.current;
      const declinedBy = message.data?.challengedId;
      const reason = message.data?.reason;
      if (outgoing && (declinedBy === undefined || declinedBy === outgoing.challengedId)) {
        clearOutgoing();
        toast.info(
          reason
            ? `Your challenge to ${outgoing.username} expired`
            : `${outgoing.username} declined your challenge`,
          { id: "challenge_declined" }
        );
        return;
      }
      // An old challenge (e.g. from another tab) ran out: nothing to tell
      if (reason) return;
      toast.info("Your challenge was declined", { id: "challenge_declined" });
    },
    [clearOutgoing, outgoingRef]
  );

  // Errors answer the last message we sent (e.g. "already sent a challenge")
  const handleError = useCallback(
    (message: NotificationWebSocketMessage) => {
      if (message.type !== NOTIFICATION_MESSAGE_TYPES.ERROR) return;
      // The server echoes the request an error answers; older servers
      // didn't, so fall back to the last message we sent
      const request = message.data.request;
      const lastSent = request?.type ?? lastSentTypeRef.current;
      // Cancelling something that's already gone: nothing to show the user
      if (lastSent === NOTIFICATION_MESSAGE_TYPES.CHALLENGE_CANCELLED) return;

      const outgoing = outgoingRef.current;
      const sameTarget =
        !request?.data || request.data.challengedId === outgoing?.challengedId;
      if (lastSent === NOTIFICATION_MESSAGE_TYPES.CHALLENGE_SENT && outgoing && sameTarget) {
        clearOutgoing();
      }
      if (
        lastSent === NOTIFICATION_MESSAGE_TYPES.CHALLENGE_ACCEPTED ||
        lastSent === NOTIFICATION_MESSAGE_TYPES.CHALLENGE_DECLINED
      ) {
        invalidateChallenges();
      }
      // The challenger changed the terms after we saw them: nothing started.
      // The server sends the new challenge (a fresh toast); the refetch
      // above brings it back to the lists too
      if (message.data.code === CHALLENGE_CHANGED) {
        toast.info("That challenge just changed. Check the new terms before accepting.", {
          id: "notification_error",
        });
        return;
      }
      toast.error(message.data.message, { id: "notification_error" });
    },
    [clearOutgoing, invalidateChallenges, lastSentTypeRef, outgoingRef]
  );

  const handleMatchCreated = useCallback(
    (message: NotificationWebSocketMessage) => {
      if (message.type !== NOTIFICATION_MESSAGE_TYPES.MATCH_CREATED) return;

      clearOutgoing();
      toast.dismiss();
      toastsShownRef.current.clear();
      // The server deletes both players' challenges when a game starts
      queryClient.setQueryData<Challenge[]>([QKEY_CHALLENGES], []);
      invalidateChallenges();
      navigate(getGameRoute(message.data.gameId), { replace: true });
    },
    [clearOutgoing, invalidateChallenges, queryClient, navigate]
  );

  // Subscribe to all message types
  useMessageDispatcher<NotificationWebSocketMessage>(
    notificationMessages,
    NOTIFICATION_MESSAGE_TYPES.CHALLENGE_RECEIVED,
    handleChallengeReceived
  );

  useMessageDispatcher<NotificationWebSocketMessage>(
    notificationMessages,
    NOTIFICATION_MESSAGE_TYPES.CHALLENGE_CANCELLED,
    handleChallengeCancelled
  );

  useMessageDispatcher<NotificationWebSocketMessage>(
    notificationMessages,
    NOTIFICATION_MESSAGE_TYPES.OPPONENT_UNAVAILABLE,
    handleOpponentUnavailable
  );

  useMessageDispatcher<NotificationWebSocketMessage>(
    notificationMessages,
    NOTIFICATION_MESSAGE_TYPES.CHALLENGE_DECLINED,
    handleChallengeDeclined
  );

  useMessageDispatcher<NotificationWebSocketMessage>(
    notificationMessages,
    NOTIFICATION_MESSAGE_TYPES.ERROR,
    handleError
  );

  useMessageDispatcher<NotificationWebSocketMessage>(
    notificationMessages,
    NOTIFICATION_MESSAGE_TYPES.MATCH_CREATED,
    handleMatchCreated
  );
};
