import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { MatchFoundMessage } from "../types/websocket-messages";
import { getGameRoute } from "@/constants/routes";

/**
 * Navigates to a newly created game. Used by both matchmaking and rematch
 * flows. The game page loads players, colors and clocks from the server, so
 * nothing is passed in navigation state and the URL works on its own.
 */
export const useStartGame = () => {
  const navigate = useNavigate();

  const startGame = useCallback(
    (message: MatchFoundMessage) => {
      if (message.data.gameId) {
        navigate(getGameRoute(message.data.gameId), { replace: true });
      }
    },
    [navigate]
  );

  return { startGame };
};
