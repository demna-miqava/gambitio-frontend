import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  GameErrorMessage,
  InitialGameStateMessage,
  PlayerConnectionMessage,
} from "@/features/game/types/websocket-messages";
import { GAME_MESSAGE_TYPES } from "@/features/game/constants/websocket-types";
import { useMessageDispatcher } from "@/hooks/useMessageDispatcher";
import { gameMessages } from "@/services/websocketMessageDispatcher";
import { useLiveGame } from "../contexts/LiveGameContext";
import {
  AWAY_GRACE_MS,
  NOBODY_AWAY,
  awayAfterChange,
  awayFromState,
  awayStatus,
  type AwayPlayers,
  type AwayStatus,
} from "../utils/connection";

const NOT_CONNECTED = "Not connected. Try again when you're back online.";
const HERE: AwayStatus = { away: false, claimInSeconds: null };

/**
 * Which of a live game's players are away from the board, as the server
 * reports it (see utils/connection.ts for the grace before it shows).
 * `statusOf(id)` is re-read every second while someone is away, so a
 * countdown built on it runs. Nobody is away once the game is over.
 */
export const usePlayerConnections = () => {
  const { gameEnded } = useLiveGame();
  const [players, setPlayers] = useState<AwayPlayers>(NOBODY_AWAY);
  const [now, setNow] = useState(() => Date.now());

  const handleInitialState = useCallback(({ data }: InitialGameStateMessage) => {
    const at = Date.now();
    setNow(at);
    setPlayers((current) => awayFromState(current, data, at));
  }, []);
  const handleChange = useCallback(({ data }: PlayerConnectionMessage) => {
    const at = Date.now();
    setNow(at);
    setPlayers((current) => awayAfterChange(current, data, at));
  }, []);
  useMessageDispatcher<InitialGameStateMessage>(
    gameMessages,
    GAME_MESSAGE_TYPES.INITIAL_GAME_STATE,
    handleInitialState
  );
  useMessageDispatcher<PlayerConnectionMessage>(
    gameMessages,
    GAME_MESSAGE_TYPES.PLAYER_CONNECTION,
    handleChange
  );

  const anyoneGone = !gameEnded && Object.keys(players.goneAt).length > 0;
  useEffect(() => {
    if (!anyoneGone) return;
    // Often enough that the grace ends and the countdown turns on time
    const tick = setInterval(() => setNow(Date.now()), Math.min(1000, AWAY_GRACE_MS / 3));
    return () => clearInterval(tick);
  }, [anyoneGone]);

  const statusOf = useCallback(
    (userId: number): AwayStatus => (gameEnded ? HERE : awayStatus(players, userId, now)),
    [gameEnded, players, now]
  );
  return { statusOf };
};

/**
 * The opponent's connection, for the player: whether they are away, the
 * seconds until the win can be claimed against them (0: now; null when it
 * can't be, as before both sides have moved), and the claim itself. The
 * server decides: a claim it refuses (the opponent is back, or it is too
 * early by its clock) shows its reason and changes nothing here, since the
 * server then says how things stand.
 */
export const useOpponentConnection = ({ bothMoved }: { bothMoved: boolean }) => {
  const { opponent, sendMessage, spectating } = useLiveGame();
  const { statusOf } = usePlayerConnections();
  const [claiming, setClaiming] = useState(false);
  const status = spectating ? HERE : statusOf(opponent.id);

  const claimWin = useCallback(() => {
    if (!sendMessage(JSON.stringify({ type: GAME_MESSAGE_TYPES.CLAIM_WIN }))) {
      toast.error(NOT_CONNECTED);
      return;
    }
    setClaiming(true);
  }, [sendMessage]);

  // Refused (useLiveGameMessages shows why): the button is there again
  const handleError = useCallback(({ data }: GameErrorMessage) => {
    if (data.request?.type === GAME_MESSAGE_TYPES.CLAIM_WIN) setClaiming(false);
  }, []);
  useMessageDispatcher<GameErrorMessage>(gameMessages, GAME_MESSAGE_TYPES.ERROR, handleError);
  // The state after a reconnect: a claim sent as the connection dropped may
  // never have arrived, and no answer to it is coming. If it did arrive,
  // this state is the finished game
  const handleState = useCallback(() => setClaiming(false), []);
  useMessageDispatcher<InitialGameStateMessage>(
    gameMessages,
    GAME_MESSAGE_TYPES.INITIAL_GAME_STATE,
    handleState
  );
  // Back at the board: a claim in flight can no longer stand
  if (claiming && !status.away) setClaiming(false);

  return {
    opponentAway: status.away,
    claimInSeconds: bothMoved ? status.claimInSeconds : null,
    claiming,
    claimWin,
  };
};
