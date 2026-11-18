import { createContext, useContext, type ReactNode, useMemo } from "react";
import { useNotificationWebSocket } from "../hooks/useNotificationWebSocket";
import {
  useManageChallenge,
  type SendChallengeData,
} from "../hooks/useManageChallenge";
import { useChallengeMessageHandlers } from "../hooks/useChallengeMessageHandlers";
import type { ChallengeRef, OutgoingChallenge } from "../types/websocket-messages";
import { useSeriesUpdates } from "@/features/series/hooks/useSeries";

type ChallengesContextType = {
  /** Accepts the challenge as shown (its version: changed terms are refused) */
  handleAcceptChallenge: (challenge: ChallengeRef) => void;
  handleDeclineChallenge: (challengerId: number) => void;
  /**
   * Challenge a friend; a challenge already waiting on someone else is
   * withdrawn. `seriesGame`: the game a series continuation would start
   */
  sendChallenge: (data: SendChallengeData, target: { username: string; seriesGame?: number }) => void;
  /** Withdraw the challenge we're waiting on */
  cancelChallenge: () => void;
  /** The challenge we sent and are waiting on, if any */
  outgoingChallenge: OutgoingChallenge | null;
};

const ChallengesContext = createContext<ChallengesContextType | undefined>(
  undefined
);

export const ChallengesProvider = ({ children }: { children: ReactNode }) => {
  // Manage WebSocket connection
  const { sendMessage, readyState } = useNotificationWebSocket();

  // Manage challenge actions (send, cancel, accept, decline)
  const {
    handleAccept,
    handleDecline,
    sendChallenge,
    cancelChallenge,
    outgoingChallenge,
    outgoingRef,
    clearOutgoing,
    removeChallenge,
    lastSentTypeRef,
  } = useManageChallenge(sendMessage, readyState);

  // Series resigned between games (the score and the other player's toast)
  useSeriesUpdates();

  // Handle incoming challenge messages
  useChallengeMessageHandlers({
    handleAccept,
    handleDecline,
    removeChallenge,
    outgoingRef,
    clearOutgoing,
    lastSentTypeRef,
  });

  const value = useMemo(
    () => ({
      handleAcceptChallenge: handleAccept,
      handleDeclineChallenge: handleDecline,
      sendChallenge,
      cancelChallenge,
      outgoingChallenge,
    }),
    [handleAccept, handleDecline, sendChallenge, cancelChallenge, outgoingChallenge]
  );

  return (
    <ChallengesContext.Provider value={value}>
      {children}
    </ChallengesContext.Provider>
  );
};

/* eslint-disable-next-line */
export const useChallenges = () => {
  const context = useContext(ChallengesContext);
  if (!context) {
    throw new Error("useChallenges must be used within ChallengesProvider");
  }
  return context;
};
