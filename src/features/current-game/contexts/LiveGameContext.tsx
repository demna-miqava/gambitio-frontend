import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { useGameNavigation } from "@/features/game/contexts/GameNavigationContext";
import {
  useGameWebSocket,
  type GameConnectionStatus,
} from "@/features/game/hooks/useGameWebSocket";
import type {
  RatingChanges,
  TimeAddedMessage,
} from "@/features/game/types/websocket-messages";
import { useChessSound } from "@/features/game/contexts/ChessSoundContext";
import { useSettings } from "@/features/settings/SettingsContext";
import type { Game, GamePlayerInfo } from "@/types";
import type { Key } from "@lichess-org/chessground/types";
import type { Square, PieceSymbol } from "chess.js";
import { getLastMove, syncBoard } from "@/features/game/utils/board-utils";
import { useLiveGameMessages } from "../hooks/useLiveGameMessages";
import { GAME_MESSAGE_TYPES } from "@/features/game/constants/websocket-types";
import { isPromotionMove } from "@/features/game/utils/promotionUtils";
import { useBoardMoveHandler } from "@/features/game/hooks/useBoardMoveHandler";
import { parseTypedMove } from "@/features/game/utils/parseTypedMove";
import { describeMove } from "@/features/game/utils/describeMove";
import {
  QKEY_ACTIVE_GAME,
  QKEY_PROFILE_STATUS,
  QKEY_USER_GAMES,
  QKEY_USER_PROFILE,
  QKEY_USER_STATS,
  QKEY_USER_STATS_SUMMARY,
} from "@/constants/queryKeys";
import { toast } from "sonner";

interface PendingPromotion {
  from: Square;
  to: Square;
}

/** Sends a message if the socket is open. Returns false (and drops it) otherwise. */
export type SendGameMessage = (message: string) => boolean;

interface LiveGameContextValue {
  game: Game;
  /**
   * Watching someone else's game: the board never takes input and there's
   * nothing to send. player/opponent are then white/black.
   */
  spectating: boolean;
  player: GamePlayerInfo;
  opponent: GamePlayerInfo;
  gameEnded: boolean;
  clockRunning: boolean;
  ratingChanges: RatingChanges | null;
  sendMessage: SendGameMessage;
  connectionStatus: GameConnectionStatus;
  isConnected: boolean;
  whiteTimeLeft: number | undefined;
  blackTimeLeft: number | undefined;
  pendingPromotion: PendingPromotion | null;
  handlePromotionSelect: (piece: PieceSymbol) => void;
  cancelPromotion: () => void;
  /** Plays a typed move ("Nf3", "e2e4"). Returns an error message, or null if it was played. */
  submitTypedMove: (text: string) => string | null;
  /** Latest message for the screen reader live region */
  announcement: string;
  /** Tells screen reader users about a game event (polite) */
  announce: (text: string) => void;
  /** Adds time to the opponent's clock (see GIVE_TIME_SECONDS). False if not sent. */
  giveTime: () => boolean;
}

const LiveGameContext = createContext<LiveGameContextValue | null>(null);

interface LiveGameProviderProps {
  game: Game;
  /** Read-only view for someone who isn't playing (see LiveGameContextValue) */
  spectating?: boolean;
  children: ReactNode;
}

export const LiveGameProvider = ({
  game,
  spectating = false,
  children,
}: LiveGameProviderProps) => {
  const { chessRef, cgRef, setTurn, color, inputLockedRef, setInputLocked } =
    useChessBoardContext();
  const { goToLastMove } = useGameNavigation();
  const {
    sendMessage: sendRaw,
    status: connectionStatus,
    getWebSocket,
  } = useGameWebSocket();
  const { settings } = useSettings();
  const { playSoundForMove } = useChessSound();
  const queryClient = useQueryClient();
  const player = color === "white" ? game.whitePlayer : game.blackPlayer;
  const opponent = color === "white" ? game.blackPlayer : game.whitePlayer;
  const isConnected = connectionStatus === "open";

  // A finished game is locked from the start, before the socket confirms it
  const [gameEnded, setGameEnded] = useState(game.status === "finished");
  const [ratingChanges, setRatingChanges] = useState<RatingChanges | null>(
    null
  );
  const [pendingPromotion, setPendingPromotion] =
    useState<PendingPromotion | null>(null);
  const [announcement, setAnnouncement] = useState("");
  // When this player's clock last started on this device (see useLiveGameMessages)
  const turnStartedAtRef = useRef<number | null>(null);

  // Repeating the same text doesn't re-announce it, so alternate a trailing
  // no-break space
  const announce = useCallback((text: string) => {
    setAnnouncement((prev) => (prev === text ? `${text}\u00a0` : text));
  }, []);

  // Never queue messages while disconnected: a resign or move queued now
  // would be sent minutes later, after the position has changed. Reads the
  // socket itself, so the function is stable (safe in toast callbacks).
  const sendMessage = useCallback<SendGameMessage>(
    (message) => {
      if (getWebSocket()?.readyState !== WebSocket.OPEN) return false;
      sendRaw(message, false);
      return true;
    },
    [getWebSocket, sendRaw]
  );

  // The Home / top bar "Return to game" banner reads the active game; keep it
  // fresh when a game page opens and when the game ends
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: [QKEY_ACTIVE_GAME] });
  }, [queryClient, gameEnded]);

  // A finished game changes the player's history, stats and ratings (Home's
  // "Your last game" and results, the header ratings). Only when it ends
  // while open here: a finished game opened later changed nothing.
  const startedLiveRef = useRef(game.status !== "finished");
  useEffect(() => {
    if (!gameEnded || spectating || !startedLiveRef.current) return;
    // QKEY_PROFILE_STATUS carries the signed-in user's ratings
    for (const key of [
      QKEY_USER_GAMES,
      QKEY_USER_STATS,
      QKEY_USER_STATS_SUMMARY,
      QKEY_USER_PROFILE,
      QKEY_PROFILE_STATUS,
    ]) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  }, [queryClient, gameEnded, spectating]);

  // The player can only move while connected and the game is on (and
  // spectators never can). Locking
  // drops selections and premoves; unlocking (back online) re-enables the
  // board from the current position. The server also resends the full state
  // on reconnect.
  const locked = spectating || gameEnded || !isConnected;
  useEffect(() => {
    setInputLocked(locked);
    const cg = cgRef.current;
    const chess = chessRef.current;
    if (locked) {
      setPendingPromotion(null);
      // A pawn dropped on the last rank waiting for its promotion piece is
      // only on the board, not in the game: put the board back
      if (cg && chess) {
        syncBoard({ cg, chess, movableColor: undefined, lastMove: getLastMove(chess) });
      }
      return;
    }
    if (!cg || !chess) return;
    setTurn(
      syncBoard({ cg, chess, movableColor: color, lastMove: getLastMove(chess) })
    );
    goToLastMove();
  }, [locked, setInputLocked, cgRef, chessRef, color, setTurn, goToLastMove]);

  const { applyMove } = useBoardMoveHandler({
    chessRef,
    cgRef,
    movableColor: color,
    setTurn,
    playSoundForMove,
  });

  /** Puts the board back to the real position (e.g. a move that can't be sent) */
  const resyncBoard = useCallback(
    (playPremove = false) => {
      const cg = cgRef.current;
      const chess = chessRef.current;
      if (!cg || !chess) return;
      setTurn(
        syncBoard({
          cg,
          chess,
          movableColor: inputLockedRef.current ? undefined : color,
          lastMove: getLastMove(chess),
          playPremove,
        })
      );
    },
    [cgRef, chessRef, color, inputLockedRef, setTurn]
  );

  // Complete a move with a specific promotion piece
  const completeMove = useCallback(
    (fromSquare: Square, toSquare: Square, promotion?: PieceSymbol) => {
      // The board is locked while offline or after the game, but a drop or
      // promotion choice can still be in flight
      if (inputLockedRef.current) {
        resyncBoard();
        return null;
      }
      const result = applyMove({
        from: fromSquare,
        to: toSquare,
        promotion,
      });
      if (!result) return null;

      // The server validates the move, detects checkmate/draws and runs the
      // clock; the local move is only an optimistic preview. thinkMs is how
      // long this player's clock ran here, so the server can leave out the
      // time the moves spent on the network (within a limit).
      const startedAt = turnStartedAtRef.current;
      const sent = sendMessage(
        JSON.stringify({
          type: GAME_MESSAGE_TYPES.MOVE,
          move: {
            from: result.move.from,
            to: result.move.to,
            ...(result.move.promotion && { promotion: result.move.promotion }),
          },
          ...(startedAt !== null && {
            thinkMs: Math.max(0, Math.round(performance.now() - startedAt)),
          }),
        })
      );
      if (!sent) {
        // The socket dropped before the lock caught up: take the move back
        chessRef.current.undo();
        resyncBoard();
        return null;
      }
      return result.move;
    },
    [applyMove, sendMessage, inputLockedRef, resyncBoard, chessRef]
  );

  // Handle promotion piece selection
  const handlePromotionSelect = useCallback(
    (piece: PieceSymbol) => {
      if (!pendingPromotion) return;

      completeMove(pendingPromotion.from, pendingPromotion.to, piece);
      setPendingPromotion(null);
    },
    [pendingPromotion, completeMove]
  );

  // Cancel promotion and revert the move
  const cancelPromotion = useCallback(() => {
    resyncBoard(true);
    setPendingPromotion(null);
  }, [resyncBoard]);

  // Handle player's piece drag/drop on the board
  const handlePlayerMove = useCallback(
    (orig: Key, dest: Key) => {
      const chess = chessRef.current;
      if (!chess) return;

      const fromSquare = orig as Square;
      const toSquare = dest as Square;

      // Check if this is a promotion move (pawn reaching 8th/1st rank)
      const piece = chess.get(fromSquare);

      const isPromotion = isPromotionMove(toSquare, piece);

      if (isPromotion) {
        // Check if auto-promote to queen is enabled
        if (settings?.autoPromoteToQueenEnabled) {
          completeMove(fromSquare, toSquare, "q");
        } else {
          // Show promotion selector
          setPendingPromotion({ from: fromSquare, to: toSquare });
        }
      } else {
        completeMove(fromSquare, toSquare);
      }
    },
    [chessRef, settings?.autoPromoteToQueenEnabled, completeMove]
  );

  // Register move handler with Chessground
  useEffect(() => {
    if (!cgRef.current) return;

    cgRef.current.set({
      events: {
        move: handlePlayerMove,
      },
    });
  }, [cgRef, handlePlayerMove]);

  const submitTypedMove = useCallback(
    (text: string) => {
      const chess = chessRef.current;
      if (spectating) return "You're watching this game.";
      if (gameEnded) return "The game is over.";
      if (!isConnected) return "Not connected. Wait for the connection to come back.";
      if (chess.turn() !== color[0]) return "It's your opponent's turn.";
      const move = parseTypedMove(chess, text);
      if (!move) return `"${text.trim()}" isn't a legal move here.`;
      goToLastMove();
      const played = completeMove(move.from, move.to, move.promotion);
      if (!played) return "That move couldn't be played.";
      announce(`You played ${describeMove(played.san)}`);
      return null;
    },
    [chessRef, spectating, gameEnded, isConnected, color, completeMove, goToLastMove, announce]
  );

  const handleOpponentMove = useCallback(
    (san: string, userId: number) => {
      // Spectators hear both sides, so name whoever moved
      const mover = !spectating
        ? opponent
        : userId === game.blackPlayer.id
          ? game.blackPlayer
          : game.whitePlayer;
      announce(`${mover.username} played ${describeMove(san)}`);
    },
    [announce, opponent, spectating, game.whitePlayer, game.blackPlayer]
  );

  const giveTime = useCallback(() => {
    if (spectating || gameEnded) return false;
    return sendMessage(JSON.stringify({ type: GAME_MESSAGE_TYPES.GIVE_TIME }));
  }, [sendMessage, spectating, gameEnded]);

  const handleTimeAdded = useCallback(
    ({ userId, color: receiver, addedMs }: TimeAddedMessage) => {
      const seconds = Math.round(addedMs / 1000);
      const giver = userId === game.whitePlayer.id ? game.whitePlayer : game.blackPlayer;
      const taker = receiver === "white" ? game.whitePlayer : game.blackPlayer;
      if (spectating) {
        announce(`${giver.username} gave ${taker.username} ${seconds} seconds`);
      } else if (receiver === color) {
        // One toast however many clicks: each replaces the last
        toast(`${giver.username} gave you ${seconds} seconds`, { id: "time_added" });
        announce(`${giver.username} gave you ${seconds} seconds`);
      } else {
        announce(`You gave ${taker.username} ${seconds} seconds`);
      }
    },
    [announce, color, spectating, game.whitePlayer, game.blackPlayer]
  );

  const requestSync = useCallback(() => {
    sendMessage(JSON.stringify({ type: GAME_MESSAGE_TYPES.SYNC }));
  }, [sendMessage]);

  const { whiteTimeLeft, blackTimeLeft, clockRunning } = useLiveGameMessages({
    setGameEnded,
    setRatingChanges,
    onOpponentMove: handleOpponentMove,
    onTimeAdded: handleTimeAdded,
    requestSync,
    turnStartedAtRef,
  });

  const value = useMemo<LiveGameContextValue>(
    () => ({
      game,
      spectating,
      player,
      opponent,
      gameEnded,
      clockRunning,
      ratingChanges,
      sendMessage,
      connectionStatus,
      isConnected,
      pendingPromotion,
      handlePromotionSelect,
      cancelPromotion,
      submitTypedMove,
      announcement,
      announce,
      giveTime,
      whiteTimeLeft,
      blackTimeLeft,
    }),
    [
      game,
      spectating,
      player,
      opponent,
      gameEnded,
      clockRunning,
      ratingChanges,
      sendMessage,
      connectionStatus,
      isConnected,
      pendingPromotion,
      handlePromotionSelect,
      cancelPromotion,
      submitTypedMove,
      announcement,
      announce,
      giveTime,
      whiteTimeLeft,
      blackTimeLeft,
    ]
  );

  return (
    <LiveGameContext.Provider value={value}>
      {children}
    </LiveGameContext.Provider>
  );
};

/* eslint-disable-next-line */
export const useLiveGame = () => {
  const context = useContext(LiveGameContext);
  if (!context) {
    throw new Error("useLiveGame must be used within LiveGameProvider");
  }
  return context;
};
