import { useCallback, useEffect, useRef, useState } from "react";
import { Chess, type Move, type PieceSymbol, type Square } from "chess.js";
import { Chessground } from "@lichess-org/chessground";
import type { Api } from "@lichess-org/chessground/api";
import type { Key } from "@lichess-org/chessground/types";
import { calculateLegalMoves } from "@/features/game/utils/board-utils";
import { isPromotionMove } from "@/features/game/utils/promotionUtils";
import { useSettings } from "@/features/settings/SettingsContext";
import { useChessSound } from "@/features/game/contexts/ChessSoundContext";
import type { PlayerColor } from "@/features/game/types/game.types";
import { useMoveNavigation } from "@/features/game/hooks/useMoveNavigation";
import { parseTypedMove } from "@/features/game/utils/parseTypedMove";
import { attachTouchDragAssist } from "@/features/game/utils/touchDragAssist";
import { BotEngine } from "../services/botEngine";
import type { Bot } from "../constants/bots";
import { botThinkDelayMs } from "../utils/thinkDelay";

/** How a bot game ended, in the server's terms (POST /games/bot) */
export type BotGameEndReason =
  | "checkmate"
  | "resignation"
  | "stalemate"
  | "insufficient_material"
  | "threefold_repetition"
  | "fifty_move_rule";

export type BotGameResult = {
  outcome: "win" | "loss" | "draw";
  /** For display: "by checkmate" */
  reason: string;
  endReason: BotGameEndReason;
};

const getResult = (chess: Chess, playerColor: PlayerColor): BotGameResult | null => {
  if (chess.isCheckmate()) {
    // The side to move is the side that got mated
    const loser = chess.turn() === "w" ? "white" : "black";
    return {
      outcome: loser === playerColor ? "loss" : "win",
      reason: "by checkmate",
      endReason: "checkmate",
    };
  }
  if (chess.isStalemate())
    return { outcome: "draw", reason: "by stalemate", endReason: "stalemate" };
  if (chess.isInsufficientMaterial())
    return {
      outcome: "draw",
      reason: "by insufficient material",
      endReason: "insufficient_material",
    };
  if (chess.isThreefoldRepetition())
    return { outcome: "draw", reason: "by repetition", endReason: "threefold_repetition" };
  if (chess.isDraw())
    return { outcome: "draw", reason: "by the 50-move rule", endReason: "fifty_move_rule" };
  return null;
};

/**
 * Fallbacks while settings load, matching the user_settings column defaults
 * on the server (what a new account gets).
 */
export const BOARD_SETTING_DEFAULTS = {
  boardCoordinatesEnabled: true,
  moveHighlightEnabled: true,
  premovesEnabled: false,
  showLegalMovesEnabled: true,
  autoPromoteToQueenEnabled: false,
} as const;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const lastMoveOf = (chess: Chess): [Key, Key] | undefined => {
  const last = chess.history({ verbose: true }).at(-1);
  return last ? [last.from, last.to] : undefined;
};

/**
 * A local game against Stockfish: the board, rules and engine all run in the
 * browser. Finished games are saved afterwards (see useSaveBotGame).
 */
export const useBotGame = (bot: Bot, playerColor: PlayerColor) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  const chessRef = useRef(new Chess());
  const engineRef = useRef<BotEngine | null>(null);
  const { settings } = useSettings();
  const coordinates =
    settings?.boardCoordinatesEnabled ?? BOARD_SETTING_DEFAULTS.boardCoordinatesEnabled;
  const highlightLastMove =
    settings?.moveHighlightEnabled ?? BOARD_SETTING_DEFAULTS.moveHighlightEnabled;
  const premoves = settings?.premovesEnabled ?? BOARD_SETTING_DEFAULTS.premovesEnabled;
  const showDests =
    settings?.showLegalMovesEnabled ?? BOARD_SETTING_DEFAULTS.showLegalMovesEnabled;
  const autoQueen =
    settings?.autoPromoteToQueenEnabled ?? BOARD_SETTING_DEFAULTS.autoPromoteToQueenEnabled;
  const { playSoundForMove, playGenericSound } = useChessSound();

  const [history, setHistory] = useState<Move[]>([]);
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState<BotGameResult | null>(null);
  const [engineError, setEngineError] = useState(false);
  // Set as soon as the game ends (including by resignation, which doesn't
  // change the position), so a late engine reply or user move is ignored
  const finishedRef = useRef(false);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);

  const playerCode = playerColor === "white" ? "w" : "b";

  // Show the current position (also after a rejected move or cancelled
  // promotion, keeping the last-move highlight)
  const syncBoard = useCallback(
    () => {
      const chess = chessRef.current;
      const cg = cgRef.current;
      if (!cg) return;
      const gameOver = chess.isGameOver() || finishedRef.current;
      const myTurn = chess.turn() === playerCode && !gameOver;
      cg.set({
        fen: chess.fen(),
        turnColor: chess.turn() === "w" ? "white" : "black",
        check: chess.inCheck(),
        lastMove: lastMoveOf(chess),
        movable: {
          color: gameOver ? undefined : playerColor,
          dests: myTurn ? calculateLegalMoves(chess) : new Map(),
        },
      });
      if (myTurn) cg.playPremove();
    },
    [playerCode, playerColor]
  );

  const afterMove = useCallback(
    (move: Move) => {
      const chess = chessRef.current;
      syncBoard();
      setHistory(chess.history({ verbose: true }));
      playSoundForMove(move, chess.isCheckmate());
      const finished = getResult(chess, playerColor);
      if (finished) {
        finishedRef.current = true;
        setResult(finished);
        cgRef.current?.stop();
      }
      return finished;
    },
    [syncBoard, playSoundForMove, playerColor]
  );

  const playEngineMove = useCallback(async () => {
    const engine = engineRef.current;
    const chess = chessRef.current;
    if (!engine || chess.isGameOver() || finishedRef.current) return;
    setThinking(true);
    try {
      const fen = chess.fen();
      const minDelay = wait(botThinkDelayMs(bot.rating));
      const uci = await engine.bestMove(fen, bot.rating);
      await minDelay;
      // Ignore a reply that arrives after the position changed (e.g. resign/restart)
      if (
        !uci ||
        finishedRef.current ||
        chessRef.current !== chess ||
        chess.fen() !== fen
      )
        return;
      const move = chess.move({
        from: uci.slice(0, 2) as Square,
        to: uci.slice(2, 4) as Square,
        promotion: (uci[4] as PieceSymbol) || undefined,
      });
      afterMove(move);
    } catch {
      setEngineError(true);
    } finally {
      setThinking(false);
    }
  }, [afterMove, bot.rating]);

  /** Returns the move played, or null if it wasn't played */
  const playUserMove = useCallback(
    (from: Square, to: Square, promotion?: PieceSymbol): Move | null => {
      const chess = chessRef.current;
      if (finishedRef.current || chess.turn() !== playerCode) return null;
      try {
        const move = chess.move({ from, to, promotion });
        const finished = afterMove(move);
        if (!finished) void playEngineMove();
        return move;
      } catch {
        syncBoard();
        return null;
      }
    },
    [afterMove, playEngineMove, syncBoard, playerCode]
  );

  // Board + engine setup
  useEffect(() => {
    if (!boardRef.current) return;
    const chess = new Chess();
    chessRef.current = chess;

    cgRef.current = Chessground(boardRef.current, {
      fen: chess.fen(),
      orientation: playerColor,
      turnColor: "white",
      coordinates,
      highlight: { lastMove: highlightLastMove, check: true },
      premovable: { enabled: premoves },
      draggable: { enabled: true },
      movable: {
        free: false,
        color: playerColor,
        showDests,
        dests: playerCode === "w" ? calculateLegalMoves(chess) : new Map(),
      },
    });

    const detachDragAssist = attachTouchDragAssist(cgRef.current);

    let engine: BotEngine | null = null;
    try {
      engine = new BotEngine();
      engineRef.current = engine;
      engine
        .newGame(bot.rating)
        .then(() => {
          playGenericSound();
          if (playerCode === "b") void playEngineMove();
        })
        .catch(() => setEngineError(true));
    } catch {
      setEngineError(true);
    }

    return () => {
      engine?.destroy();
      engineRef.current = null;
      detachDragAssist();
      cgRef.current?.destroy();
      cgRef.current = null;
    };
    // Set up once per game; settings changes are applied below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Route user moves through chess.js (and the promotion picker when needed)
  useEffect(() => {
    cgRef.current?.set({
      movable: {
        events: {
          after: (orig, dest) => {
            const from = orig as Square;
            const to = dest as Square;
            const piece = chessRef.current.get(from);
            if (isPromotionMove(to, piece)) {
              if (autoQueen) {
                playUserMove(from, to, "q");
                return;
              }
              setPendingPromotion({ from, to });
              return;
            }
            playUserMove(from, to);
          },
        },
      },
    });
  }, [playUserMove, autoQueen]);

  useEffect(() => {
    cgRef.current?.set({
      coordinates,
      highlight: { lastMove: highlightLastMove, check: true },
      premovable: { enabled: premoves },
      movable: { showDests },
    });
    if (!premoves) cgRef.current?.cancelPremove();
  }, [coordinates, highlightLastMove, premoves, showDests]);

  // Stepping through earlier moves. New moves jump back to the live position
  // (useMoveNavigation resets on a new move count), as in live games.
  const navigation = useMoveNavigation(history.length);
  const { viewingIndex } = navigation;
  useEffect(() => {
    const cg = cgRef.current;
    if (!cg) return;
    if (viewingIndex === null) {
      syncBoard();
      return;
    }
    const moves = chessRef.current.history({ verbose: true });
    const shown = moves[viewingIndex - 1];
    const position = new Chess(shown ? shown.after : undefined);
    cg.cancelPremove();
    cg.selectSquare(null);
    cg.set({
      fen: position.fen(),
      turnColor: position.turn() === "w" ? "white" : "black",
      check: position.inCheck(),
      lastMove: shown ? [shown.from, shown.to] : undefined,
      movable: { color: undefined, dests: new Map() },
    });
  }, [viewingIndex, syncBoard]);

  const selectPromotion = (piece: PieceSymbol) => {
    if (!pendingPromotion) return;
    const { from, to } = pendingPromotion;
    setPendingPromotion(null);
    playUserMove(from, to, piece);
  };

  const cancelPromotion = () => {
    setPendingPromotion(null);
    // Back to the live position, also if arrow keys stepped away meanwhile
    navigation.goToLastMove();
    syncBoard();
  };

  /**
   * Keyboard play: plays a move typed as SAN or coordinates (TypedMoveInput).
   * Returns an error message, or null once the move was played.
   */
  const submitTypedMove = (text: string): string | null => {
    const chess = chessRef.current;
    if (finishedRef.current) return "The game is over.";
    if (engineError) return "The engine couldn't start. Try reloading the page.";
    if (chess.turn() !== playerCode || thinking) return `It's ${bot.name}'s turn.`;
    const move = parseTypedMove(chess, text);
    if (!move) return `"${text.trim()}" isn't a legal move here.`;
    setPendingPromotion(null);
    navigation.goToLastMove();
    return playUserMove(move.from, move.to, move.promotion) ? null : "That move couldn't be played.";
  };

  const resign = () => {
    if (result || finishedRef.current) return;
    finishedRef.current = true;
    setResult({ outcome: "loss", reason: "by resignation", endReason: "resignation" });
    cgRef.current?.stop();
    cgRef.current?.set({ movable: { color: undefined, dests: new Map() } });
  };

  return {
    boardRef,
    history,
    thinking,
    result,
    engineError,
    pendingPromotion,
    selectPromotion,
    cancelPromotion,
    resign,
    submitTypedMove,
    navigation,
    isPlayerTurn:
      !result && chessRef.current.turn() === playerCode && !thinking,
  };
};
