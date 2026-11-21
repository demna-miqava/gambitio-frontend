import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Chess, type PieceSymbol, type Square } from "chess.js";
import type { Key } from "@lichess-org/chessground/types";
import { toast } from "sonner";
import { QKEY_DUEL } from "@/constants/queryKeys";
import { calculateLegalMoves } from "@/features/game/utils/board-utils";
import { useChessground } from "@/features/game/hooks/useChessground";
import { useBoardSettings } from "@/features/game/hooks/useBoardSettings";
import { usePromotionPicker } from "@/features/game/hooks/usePromotionPicker";
import { useChessSound } from "@/features/game/contexts/ChessSoundContext";
import { NOTIFICATION_MESSAGE_TYPES } from "@/features/notifications/constants/websocket-types";
import { useMessageDispatcher } from "@/hooks/useMessageDispatcher";
import { useUser } from "@/hooks/useUser";
import { notificationMessages } from "@/services/websocketMessageDispatcher";
import { getDuel, sendDuelMove } from "@/services/puzzleDuels";
import type { DuelEndedMessage, DuelProgressMessage, DuelState, FinishedPuzzle, ShownPuzzle } from "../types";
import { clockOffset, positionAfter, solverColor, splitPlayers } from "../utils/duel";
import { duelErrorMessage } from "./useDuelInvites";

/** How long a solved puzzle stays before the next one, and a miss (marked red) */
const SOLVED_PAUSE_MS = 350;
const MISSED_PAUSE_MS = 900;
/** The opponent's reply waits this long, so it reads as a move */
const REPLY_DELAY_MS = 250;
const TICK_MS = 250;

export type DuelPhase = "loading" | "countdown" | "playing" | "out" | "waiting" | "over";

/** What the last finished puzzle was: shown on the board for a moment */
export type DuelFlash = { kind: "solved" | "missed"; square: Key } | null;

/**
 * One puzzle duel for the signed-in player: the state from the server (and
 * again on rejoin, the end, or anything that goes wrong), the server's clock,
 * the board for the current puzzle, the moves (each judged by the server),
 * and the other player's score and strikes as they come in.
 */
export const useDuelGame = (duelId: number) => {
  const { id: viewerId } = useUser();
  const queryClient = useQueryClient();
  const offsetRef = useRef(0);
  const query = useQuery({
    queryKey: [QKEY_DUEL, duelId],
    queryFn: async () => {
      const sentAt = Date.now();
      const state = await getDuel(duelId);
      offsetRef.current = clockOffset(state.serverNow, sentAt, Date.now());
      return state;
    },
    staleTime: Infinity,
    // Not kept once the page is left: the local copies below move on with
    // every move and the cached state doesn't, so coming back to a duel
    // would start from an old puzzle and score (and without the server's
    // clock, which only a fetch sets)
    gcTime: 0,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const state = query.data;
  const refetch = query.refetch;

  // Local copies, moved on by each answer to a move
  const [puzzle, setPuzzle] = useState<ShownPuzzle | null>(null);
  const [mine, setMine] = useState<{ score: number; strikes: number; out: boolean } | null>(null);
  const [theirs, setTheirs] = useState<{ score: number; strikes: number; out: boolean } | null>(null);
  const [finished, setFinished] = useState<FinishedPuzzle[]>([]);
  const [results, setResults] = useState<{ index: number; solved: boolean }[]>([]);
  const [flash, setFlash] = useState<DuelFlash>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // A new state from the server replaces the local copies
  const [appliedState, setAppliedState] = useState<DuelState | undefined>(undefined);
  if (state && state !== appliedState) {
    setAppliedState(state);
    const { me, opponent } = splitPlayers(state.players, viewerId);
    setPuzzle(state.puzzle);
    setMine(me && { score: me.score, strikes: me.strikes, out: me.out });
    setTheirs(opponent && { score: opponent.score, strikes: opponent.strikes, out: opponent.out });
    setFinished(state.finishedPuzzles);
    setResults(me?.results ?? []);
  }

  const serverNow = now + offsetRef.current;
  const over = state?.status === "finished";
  const started = !!state && serverNow >= state.startsAt;
  const timeUp = !!state && serverNow >= state.endsAt;
  let phase: DuelPhase = "loading";
  if (state) {
    if (over) phase = "over";
    else if (!started) phase = "countdown";
    else if (timeUp) phase = "waiting";
    else if (mine?.out) phase = "out";
    else phase = "playing";
  }

  // The clock
  useEffect(() => {
    if (phase === "over" || phase === "loading") return;
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [phase]);

  // The countdown ended: get the first puzzle
  const countdownEnded = phase !== "countdown" && phase !== "loading";
  useEffect(() => {
    if (countdownEnded && !over && state && !state.puzzle && !mine?.out && !puzzle) void refetch();
  }, [countdownEnded, over, state, mine?.out, puzzle, refetch]);

  // The clock ran out: the server ends the duel; if its message doesn't
  // come (a dropped socket), ask
  useEffect(() => {
    if (phase !== "waiting") return;
    const timer = setTimeout(() => void refetch(), 2_500);
    return () => clearTimeout(timer);
  }, [phase, refetch]);

  // Live: the other player's progress, and the end
  const handleProgress = useCallback(
    ({ data }: DuelProgressMessage) => {
      if (data.duelId !== duelId || data.userId === viewerId) return;
      setTheirs({ score: data.score, strikes: data.strikes, out: data.out });
    },
    [duelId, viewerId]
  );
  useMessageDispatcher<DuelProgressMessage>(notificationMessages, NOTIFICATION_MESSAGE_TYPES.DUEL_PROGRESS, handleProgress);
  const handleEnded = useCallback(
    ({ data }: DuelEndedMessage) => {
      if (data.duelId === duelId) void queryClient.invalidateQueries({ queryKey: [QKEY_DUEL, duelId] });
    },
    [duelId, queryClient]
  );
  useMessageDispatcher<DuelEndedMessage>(notificationMessages, NOTIFICATION_MESSAGE_TYPES.DUEL_ENDED, handleEnded);

  // ------------------------------------------------------------------ board
  const boardSettings = useBoardSettings();
  const chessRef = useRef(new Chess());
  const { boardRef, cgRef } = useChessground(
    () => ({ movable: { free: false, color: undefined }, draggable: { enabled: true } }),
    { dragAssist: true, settings: boardSettings }
  );
  const canMove = phase === "playing" && !!puzzle && !busy && !flash;
  const color = puzzle ? solverColor(puzzle.fen) : "white";

  // The player rows above and below the board appear once the duel has
  // loaded, which moves the board down; Chessground keeps the board's old
  // position until the page scrolls or resizes, so clicks would land a
  // square off. Measure it again.
  const loaded = !!state;
  useLayoutEffect(() => {
    if (loaded) cgRef.current?.state.dom.bounds.clear();
  }, [loaded, cgRef]);

  // The board shows the current puzzle as played so far
  const syncBoard = useCallback(
    (lastMove?: [Key, Key]) => {
      const cg = cgRef.current;
      if (!cg) return;
      const chess = chessRef.current;
      const movable = canMove && chess.turn() === color[0];
      cg.set({
        fen: chess.fen(),
        orientation: color,
        turnColor: chess.turn() === "w" ? "white" : "black",
        check: chess.inCheck(),
        lastMove,
        movable: { color: movable ? color : undefined, dests: movable ? calculateLegalMoves(chess) : new Map() },
        highlight: { custom: new Map() },
      });
    },
    [cgRef, canMove, color]
  );

  const puzzleKey = puzzle ? `${puzzle.index}:${puzzle.played.length}` : null;
  useEffect(() => {
    if (!puzzle) {
      cgRef.current?.set({ movable: { color: undefined, dests: new Map() } });
      return;
    }
    chessRef.current = positionAfter(puzzle.fen, puzzle.played);
    const last = chessRef.current.history({ verbose: true }).at(-1);
    syncBoard(last ? [last.from, last.to] : undefined);
    // Only for a new puzzle or new moves in it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzleKey]);

  // Movable or not follows the phase
  useEffect(() => {
    if (!flash) syncBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canMove]);

  const { playSoundForMove, playGameEndSound } = useChessSound();
  const wasOverRef = useRef(over);
  useEffect(() => {
    if (over && !wasOverRef.current) playGameEndSound();
    wasOverRef.current = over;
  }, [over, playGameEndSound]);

  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => pendingTimers.current.forEach(clearTimeout), []);
  const later = (fn: () => void, ms: number) => pendingTimers.current.push(setTimeout(fn, ms));

  const playMove = useCallback(
    (from: Square, to: Square, promotion?: PieceSymbol) => {
      const current = puzzle;
      if (!current || !canMove) return;
      const chess = chessRef.current;
      let played;
      try {
        played = chess.move({ from, to, promotion });
      } catch {
        syncBoard();
        return;
      }
      const uci = `${from}${to}${promotion ?? ""}`;
      playSoundForMove(played, chess.isCheckmate());
      setBusy(true);
      cgRef.current?.set({ fen: chess.fen(), lastMove: [from, to], movable: { color: undefined, dests: new Map() } });
      sendDuelMove(duelId, current.index, uci)
        .then((result) => {
          setMine({ score: result.score, strikes: result.strikes, out: result.out });
          if (result.finishedPuzzle) {
            const done = result.finishedPuzzle;
            setFinished((list) => [...list.filter((p) => p.index !== done.index), done]);
            setResults((list) => [...list, { index: done.index, solved: result.outcome === "solved" }]);
          }
          if (result.outcome === "continue" && result.reply) {
            const reply = result.reply;
            later(() => {
              const replied = positionAfter(chess.fen(), [reply]);
              const move = replied.history({ verbose: true }).at(-1);
              if (move) playSoundForMove(move, false);
              setPuzzle({ ...current, played: [...current.played, result.move, reply] });
              setBusy(false);
            }, REPLY_DELAY_MS);
            return;
          }
          const solved = result.outcome === "solved";
          // Out: if the other player is too, the duel just ended; don't
          // count on the socket alone to say so
          if (result.out) later(() => void refetch(), 1_200);
          setFlash({ kind: solved ? "solved" : "missed", square: to as Key });
          cgRef.current?.set({
            highlight: { custom: new Map([[to as Key, solved ? "duel-solved" : "duel-missed"]]) },
          });
          later(
            () => {
              setFlash(null);
              setBusy(false);
              setPuzzle(result.nextPuzzle);
            },
            solved ? SOLVED_PAUSE_MS : MISSED_PAUSE_MS
          );
        })
        .catch((error) => {
          // The move may never have reached the server: the board goes back
          // to the puzzle as it stood (the effect on canMove draws it), or
          // it would keep a move that wasn't played, with nothing to move.
          // If the server did play it, its state below says so
          chessRef.current = positionAfter(current.fen, current.played);
          setBusy(false);
          toast.error(duelErrorMessage(error, "Couldn't send your move."));
          // Whatever happened (the duel ended, a dropped connection), start again from the server's view
          void refetch();
        });
    },
    [puzzle, canMove, duelId, syncBoard, playSoundForMove, refetch, cgRef]
  );

  const { pendingPromotion, setPendingPromotion, selectPromotion } = usePromotionPicker(
    cgRef,
    chessRef,
    playMove,
    boardSettings.autoQueen
  );
  const cancelPromotion = () => {
    setPendingPromotion(null);
    chessRef.current = positionAfter(puzzle?.fen ?? chessRef.current.fen(), puzzle?.played ?? []);
    syncBoard();
  };

  const { me, opponent } = state ? splitPlayers(state.players, viewerId) : { me: null, opponent: null };

  return {
    state,
    isLoading: query.isPending,
    isError: query.isError,
    retry: refetch,
    phase,
    serverNow,
    puzzle,
    color,
    me: me && mine ? { ...me, ...mine, results } : me,
    opponent: opponent && theirs ? { ...opponent, ...theirs } : opponent,
    finishedPuzzles: finished,
    flash,
    boardRef,
    pendingPromotion,
    selectPromotion,
    cancelPromotion,
  };
};

export type DuelGame = ReturnType<typeof useDuelGame>;
