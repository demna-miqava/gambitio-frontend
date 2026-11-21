import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { WS_BASE_URL } from "@/constants/apiConfig";
import {
  QKEY_TOURNAMENT,
  QKEY_TOURNAMENTS,
  QKEY_TOURNAMENT_STANDINGS,
} from "@/constants/queryKeys";
import { getGameRoute } from "@/constants/routes";
import { ON_MESSAGE_ONLY, RECONNECT_OPTIONS } from "@/constants/websocket";
import { useAuthenticatedWebSocket, useSocketReauth } from "@/hooks/useAuthenticatedWebSocket";
import { parseWebSocketMessage } from "@/features/game/utils/websocket-helpers";
import { getApiErrorMessage } from "@/lib/utils";
import {
  cancelTournament,
  getTournament,
  getTournamentMine,
  joinTournament,
  pauseTournament,
  withdrawFromTournament,
} from "@/services/tournaments";
import type { Standing, TournamentServerMessage, TournamentState } from "../types";
import { applyTournamentMessage, isOpen } from "../utils/tournamentFormat";

/**
 * How often a player further down than the lines the lobby is sent asks for
 * their own line when only their place may have moved (others scored). When
 * their own line changed the message says so and they ask at once.
 */
const OWN_LINE_EVERY_MS = 30_000;
/** Those asks are spread over this long, so everyone down there doesn't ask in the same moment */
const OWN_LINE_SPREAD_MS = 5_000;

const isMissing = (error: unknown) =>
  isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 400);

/**
 * A tournament's lobby, kept live.
 *
 * The state comes from GET /tournaments/:id and then from the lobby socket,
 * which sends the whole state on every connect and the standings as they
 * change. The standings it sends are the top of the table: a player further
 * down gets their own line from GET /tournaments/:id/me, when the message
 * says it changed and otherwise only now and then. The socket is open while the tournament is (scheduled or
 * running) and this hook is mounted, and that is also what tells the server
 * the player is here: only players with it open are paired. The lobby page
 * and a tournament game's page both mount it.
 *
 * It also opens the player's next game when the lobby says one has started
 * ("pairings"). The notifications socket's "match_created" normally gets
 * there first and does the same; this is for when that one missed them (it
 * was reconnecting), so they don't lose a game they never saw.
 *
 * @param tournamentId - null fetches and connects nothing
 */
export const useTournament = (tournamentId: number | null) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const queryKey = [QKEY_TOURNAMENT, tournamentId];
  const query = useQuery<TournamentState>({
    queryKey,
    queryFn: () => getTournament(tournamentId!),
    enabled: tournamentId !== null,
    retry: (failures, error) => !isMissing(error) && failures < 1,
  });

  // The server said there is no such tournament: stop asking. Kept by id:
  // the page stays mounted from one tournament to the next (back and
  // forward), and the next one is there
  const [goneId, setGoneId] = useState<number | null>(null);
  const goneRef = useRef<number | null>(null);
  const gone = tournamentId !== null && goneId === tournamentId;
  const tournament = query.data?.tournament;
  const live = tournamentId !== null && !gone && !isMissing(query.error) && (!tournament || isOpen(tournament));
  const { getUrl, protocols } = useAuthenticatedWebSocket(
    live ? `${WS_BASE_URL}/tournament/${tournamentId}` : null
  );

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [QKEY_TOURNAMENT, tournamentId] });
  }, [queryClient, tournamentId]);

  // The viewer's own line, for when they are below the lines the socket
  // sends: fetched by itself (the message has the rest of the lobby), at
  // once or within a while (see OWN_LINE_EVERY_MS)
  const ownLine = useRef<{ at: number; timer: ReturnType<typeof setTimeout> | null }>({ at: 0, timer: null });
  const fetchOwnLine = useCallback(() => {
    if (tournamentId === null) return;
    const own = ownLine.current;
    if (own.timer !== null) clearTimeout(own.timer);
    own.timer = null;
    own.at = Date.now();
    getTournamentMine(tournamentId).then(
      ({ me, myGameId }) =>
        queryClient.setQueryData<TournamentState>(
          [QKEY_TOURNAMENT, tournamentId],
          (state) => state && { ...state, me, myGameId }
        ),
      // The next change asks again
      () => {}
    );
  }, [queryClient, tournamentId]);
  const fetchOwnLineSoon = useCallback(() => {
    const own = ownLine.current;
    if (own.timer !== null) return;
    const wait = Math.max(0, own.at + OWN_LINE_EVERY_MS - Date.now()) + Math.random() * OWN_LINE_SPREAD_MS;
    own.timer = setTimeout(() => {
      own.timer = null;
      fetchOwnLine();
    }, wait);
  }, [fetchOwnLine]);
  useEffect(() => {
    const own = ownLine.current;
    return () => {
      if (own.timer !== null) clearTimeout(own.timer);
      own.timer = null;
      own.at = 0;
    };
  }, [tournamentId]);

  const { sendMessage, readyState } = useWebSocket(getUrl, {
    ...RECONNECT_OPTIONS,
    ...ON_MESSAGE_ONLY,
    shouldReconnect: () => goneRef.current !== tournamentId,
    protocols,
    onMessage: (event) => {
      const message = parseWebSocketMessage<TournamentServerMessage>(event);
      if (!message) return;
      if (message.type === "error") {
        if (message.data?.code === "TOURNAMENT_NOT_FOUND") {
          goneRef.current = tournamentId;
          setGoneId(tournamentId);
        }
        return;
      }
      const key = [QKEY_TOURNAMENT, tournamentId];
      const { state, stale, ownLine: own, pairedGameId } = applyTournamentMessage(
        queryClient.getQueryData<TournamentState>(key),
        message
      );
      if (state) queryClient.setQueryData(key, state);
      if (message.type === "pairings") {
        const route = pairedGameId !== undefined ? getGameRoute(pairedGameId) : null;
        // Already there when "match_created" arrived first
        if (route !== null && window.location.pathname !== route) navigate(route, { replace: true });
        return;
      }
      if (message.type !== "state") {
        // Pages of the standings past the first aren't in the message
        void queryClient.invalidateQueries({ queryKey: [QKEY_TOURNAMENT_STANDINGS, tournamentId] });
      }
      if (message.type === "tournament") void queryClient.invalidateQueries({ queryKey: [QKEY_TOURNAMENTS] });
      if (stale) refresh();
      else if (own === "changed") fetchOwnLine();
      else if (own === "moved") fetchOwnLineSoon();
    },
  });
  useSocketReauth(sendMessage, readyState);

  return {
    state: query.data,
    isPending: query.isPending,
    /** There is no such tournament */
    notFound: gone || isMissing(query.error),
    /** It couldn't be loaded (and nothing cached to show) */
    isError: query.isError && !query.data && !isMissing(query.error),
    refetch: query.refetch,
    /** The lobby socket is open: the player counts as here */
    isConnected: readyState === ReadyState.OPEN,
  };
};

/** Join, pause, leave and cancel, each updating the lobby it is shown in. */
export const useTournamentActions = (tournamentId: number) => {
  const queryClient = useQueryClient();
  const key = [QKEY_TOURNAMENT, tournamentId];
  const setMe = (me: Standing | null) =>
    queryClient.setQueryData<TournamentState>(key, (state) => state && { ...state, me });
  const settled = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: key }),
      queryClient.invalidateQueries({ queryKey: [QKEY_TOURNAMENTS] }),
    ]);
  const failed = (fallback: string) => (error: unknown) => {
    toast.error(getApiErrorMessage(error, fallback));
    // What the lobby shows was out of date (it filled up, it ended)
    void settled();
  };

  const join = useMutation({
    mutationFn: () => joinTournament(tournamentId),
    onSuccess: ({ me }) => {
      setMe(me);
      return settled();
    },
    onError: failed("Couldn't join the tournament. Try again."),
  });
  const pause = useMutation({
    mutationFn: () => pauseTournament(tournamentId),
    onSuccess: ({ me }) => {
      setMe(me);
      return settled();
    },
    onError: failed("Couldn't pause. Try again."),
  });
  const withdraw = useMutation({
    mutationFn: () => withdrawFromTournament(tournamentId),
    onSuccess: () => {
      toast.success("You left the tournament");
      return settled();
    },
    onError: failed("Couldn't leave the tournament. Try again."),
  });
  const cancel = useMutation({
    mutationFn: () => cancelTournament(tournamentId),
    onSuccess: () => {
      toast.success("Tournament cancelled");
      return settled();
    },
    onError: failed("Couldn't cancel the tournament. Try again."),
  });

  return { join, pause, withdraw, cancel };
};
