import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  AcceptChallengeMessage,
  CancelChallengeMessage,
  DeclineChallengeMessage,
  SendChallengeMessage,
  Challenge,
  ChallengeRef,
  OutgoingChallenge,
} from "../types/websocket-messages";
import { NOTIFICATION_MESSAGE_TYPES } from "../constants/websocket-types";
import { useQueryClient } from "@tanstack/react-query";
import { QKEY_CHALLENGES } from "@/constants/queryKeys";
import type { SendMessage } from "react-use-websocket";
import { getSentChallenge } from "@/services/challenges";
import type { ReadyState } from "react-use-websocket";
import { timeOdds } from "@/utils/timeControl";
import type { OpeningSummary } from "@/features/openings/startingOpenings";

/** Same as the server's CHALLENGE_TTL_MS: unanswered challenges expire */
export const CHALLENGE_TTL_MS = 10 * 60_000;

/** Toast ids, so only the relevant toast is dismissed (not every toast). */
export const challengeToastId = (challengerId: number) =>
  `challenge:${challengerId}`;

export type SendChallengeData = SendChallengeMessage["data"];

/**
 * Accepting names the version of the challenge the player saw, so the server
 * refuses it (CHALLENGE_CHANGED) if the challenger changed the terms since.
 */
export const acceptChallengeMessage = ({ challengerId, version }: ChallengeRef): AcceptChallengeMessage => ({
  type: NOTIFICATION_MESSAGE_TYPES.CHALLENGE_ACCEPTED,
  data: { challengerId, ...(typeof version === "number" ? { version } : {}) },
});

/**
 * Sends challenge actions over the notification socket and keeps track of
 * the challenge the user is waiting on (one at a time).
 */
export const useManageChallenge = (
  sendMessage: SendMessage,
  readyState: ReadyState
) => {
  const queryClient = useQueryClient();
  const [outgoingChallenge, setOutgoingState] =
    useState<OutgoingChallenge | null>(null);
  // Read by socket handlers, which must see the latest value
  const outgoingRef = useRef<OutgoingChallenge | null>(null);
  // Bumped on every local send/cancel, so a server snapshot fetched before
  // one of them doesn't overwrite it
  const changeSeqRef = useRef(0);
  const setOutgoingChallenge = useCallback(
    (challenge: OutgoingChallenge | null) => {
      changeSeqRef.current += 1;
      outgoingRef.current = challenge;
      setOutgoingState(challenge);
    },
    []
  );

  // On every (re)connect, take the server's word for the challenge we're
  // waiting on: replies sent while we were offline are lost, and a reload
  // forgets local state while the challenge may still be open
  useEffect(() => {
    if (readyState !== 1) return;
    const seq = changeSeqRef.current;
    let cancelled = false;
    getSentChallenge()
      .then((sent) => {
        if (cancelled || seq !== changeSeqRef.current) return;
        const next: OutgoingChallenge | null = sent && {
          challengedId: sent.challengedId,
          username: sent.username ?? "your friend",
          color: sent.color,
          time: sent.time,
          increment: sent.increment,
          ownTime: sent.ownTime ?? null,
          opponentTime: sent.opponentTime ?? null,
          bestOf: sent.bestOf,
          rated: sent.rated !== false,
          opening: sent.opening ?? null,
          matchMinutes: sent.matchMinutes ?? null,
          ...(sent.seriesId ? { seriesId: sent.seriesId } : {}),
          ...(sent.seriesGame ? { seriesGame: sent.seriesGame } : {}),
          sentAt: new Date(sent.createdAt).getTime(),
        };
        outgoingRef.current = next;
        setOutgoingState(next);
      })
      .catch(() => {
        // Keep what we have; the client-side expiry still applies
      });
    return () => {
      cancelled = true;
    };
  }, [readyState]);

  // Expire it locally too, in case the server's notice never arrives
  useEffect(() => {
    if (!outgoingChallenge) return;
    const left = outgoingChallenge.sentAt + CHALLENGE_TTL_MS - Date.now();
    const timer = setTimeout(() => {
      if (outgoingRef.current !== outgoingChallenge) return;
      setOutgoingChallenge(null);
      toast.info(`Your challenge to ${outgoingChallenge.username} expired`, {
        id: "challenge_declined",
      });
    }, Math.max(0, left));
    return () => clearTimeout(timer);
  }, [outgoingChallenge, setOutgoingChallenge]);
  /**
   * Type of the last message we sent. The server answers failures with a
   * bare error message, so this tells what an error refers to.
   */
  const lastSentTypeRef = useRef<NOTIFICATION_MESSAGE_TYPES | null>(null);

  const send = useCallback(
    (
      message:
        | SendChallengeMessage
        | CancelChallengeMessage
        | AcceptChallengeMessage
        | DeclineChallengeMessage
    ) => {
      lastSentTypeRef.current = message.type;
      sendMessage(JSON.stringify(message));
    },
    [sendMessage]
  );

  const checkConnection = useCallback(() => {
    if (readyState !== 1) {
      toast.error("Not connected. Check your connection and try again.");
      return false;
    }
    return true;
  }, [readyState]);

  const clearOutgoing = useCallback(
    () => setOutgoingChallenge(null),
    [setOutgoingChallenge]
  );

  const cancelChallenge = useCallback(() => {
    const outgoing = outgoingRef.current;
    if (!outgoing) return;
    setOutgoingChallenge(null);
    // Sent even while disconnected: react-use-websocket queues it for the
    // reconnect, and the server may still hold the challenge
    send({
      type: NOTIFICATION_MESSAGE_TYPES.CHALLENGE_CANCELLED,
      data: { challengedId: outgoing.challengedId },
    });
  }, [send, setOutgoingChallenge]);

  const sendChallenge = useCallback(
    (
      data: SendChallengeData,
      target: { username: string; seriesGame?: number; opening?: OpeningSummary | null }
    ) => {
      if (!checkConnection()) return;
      const previous = outgoingRef.current;
      if (previous?.challengedId === data.challengedId) return;
      // One challenge at a time: withdraw the previous one first
      if (previous) cancelChallenge();

      send({ type: NOTIFICATION_MESSAGE_TYPES.CHALLENGE_SENT, data });
      const odds = timeOdds(data.time, data.opponentTime);
      setOutgoingChallenge({
        ...data,
        // As the server stores it: the longer clock, and both when they differ
        time: odds ? Math.max(...odds) : data.time,
        ownTime: odds?.[0] ?? null,
        opponentTime: odds?.[1] ?? null,
        // Time odds always make it unrated
        rated: !odds && data.rated !== false,
        username: target.username,
        ...(target.seriesGame ? { seriesGame: target.seriesGame } : {}),
        opening: target.opening ?? null,
        sentAt: Date.now(),
      });
    },
    [cancelChallenge, checkConnection, send, setOutgoingChallenge]
  );

  const removeChallenge = useCallback(
    (challengerId: number) => {
      queryClient.setQueryData<Challenge[]>([QKEY_CHALLENGES], (old = []) =>
        old.filter((challenge) => challenge.challengerId !== challengerId)
      );
      toast.dismiss(challengeToastId(challengerId));
    },
    [queryClient]
  );

  const handleAccept = useCallback(
    ({ challengerId, version }: ChallengeRef) => {
      if (!checkConnection()) return;
      // Only this challenge: if accepting fails (e.g. the challenger started
      // another game) the others are still valid. When the game does start,
      // match_created clears them all, as the server does.
      removeChallenge(challengerId);
      send(acceptChallengeMessage({ challengerId, version }));
    },
    [checkConnection, removeChallenge, send]
  );

  const handleDecline = useCallback(
    (challengerId: number) => {
      if (!checkConnection()) return;
      removeChallenge(challengerId);
      send({
        type: NOTIFICATION_MESSAGE_TYPES.CHALLENGE_DECLINED,
        data: { challengerId },
      });
    },
    [checkConnection, removeChallenge, send]
  );

  return {
    sendChallenge,
    cancelChallenge,
    handleAccept,
    handleDecline,
    outgoingChallenge,
    outgoingRef,
    clearOutgoing,
    removeChallenge,
    lastSentTypeRef,
  };
};
