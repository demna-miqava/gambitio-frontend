import { createContext, useContext, type ReactNode, useMemo } from "react";
import { useNotificationWebSocket } from "../hooks/useNotificationWebSocket";
import {
  useManageChallenge,
  type SendChallengeData,
} from "../hooks/useManageChallenge";
import { useChallengeMessageHandlers } from "../hooks/useChallengeMessageHandlers";
import type { OutgoingChallenge } from "../types/websocket-messages";

type ChallengesContextType = {
  handleAcceptChallenge: (challengerId: number) => void;
  handleDeclineChallenge: (challengerId: number) => void;
  /** Challenge a friend; a challenge already waiting on someone else is withdrawn */
  sendChallenge: (data: SendChallengeData, target: { username: string }) => void;
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
