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
import { botUndoPlies } from "../utils/botUndo";
import { useBoardOrientation } from "@/features/game/hooks/useBoardOrientation";

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
  // The player's side at the bottom until they flip the board
  const { orientation, flip } = useBoardOrientation(cgRef, playerColor);
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
  const { playSoundForMove, playGameEndSound } = useChessSound();

  const [history, setHistory] = useState<Move[]>([]);
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState<BotGameResult | null>(null);
  const [engineError, setEngineError] = useState(false);
  // Set as soon as the game ends (including by resignation, which doesn't
  // change the position), so a late engine reply or user move is ignored
  const finishedRef = useRef(false);
  // Bumped by every bot search and by Undo: a search whose number is no
  // longer current was cancelled, and its reply is dropped
  const searchIdRef = useRef(0);
  // The engine search under way, if any. Undo stops it, and the next search
  // waits for its (dropped) reply first: the engine answers one search at a
  // time, and a new search started before the stopped one has answered
  // would get that answer.
  const searchRef = useRef<Promise<unknown> | null>(null);
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
      const finished = getResult(chess, playerColor);
      playSoundForMove(move, finished !== null);
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
    const searchId = ++searchIdRef.current;
    const isCurrent = () => searchIdRef.current === searchId;
    setThinking(true);
    try {
      await searchRef.current?.catch(() => {});
      if (!isCurrent()) return;
      const fen = chess.fen();
      const minDelay = wait(botThinkDelayMs(bot.rating));
      const search = engine.bestMove(fen, bot.rating);
      searchRef.current = search;
      const uci = await search.finally(() => {
        if (searchRef.current === search) searchRef.current = null;
      });
      await minDelay;
      // Ignore a reply that arrives after the position changed (e.g.
      // undo/resign/restart)
      if (
        !uci ||
        !isCurrent() ||
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
      // A cancelled search leaves "thinking" to the one that replaced it
      if (isCurrent()) setThinking(false);
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

  /**
   * Takes back the player's last move and the bot's reply, or only the
   * player's move while the bot is still thinking (the search is cancelled).
   * Either way it's the player's move again. Not once the game is over.
   * Returns the number of moves left, or null if nothing was taken back.
   */
  const undo = (): number | null => {
    const chess = chessRef.current;
    if (finishedRef.current || engineError) return null;
    const plies = botUndoPlies(chess.history({ verbose: true }), playerCode);
    if (plies === 0) return null;
    searchIdRef.current += 1;
    if (searchRef.current) engineRef.current?.stop();
    setThinking(false);
    for (let i = 0; i < plies; i++) chess.undo();
    setPendingPromotion(null);
    // A premove or selection was for the position that's gone
    cgRef.current?.cancelPremove();
    cgRef.current?.selectSquare(null);
    navigation.goToLastMove();
    syncBoard();
    const moves = chess.history({ verbose: true });
    setHistory(moves);
    return moves.length;
  };

  const resign = () => {
    if (result || finishedRef.current) return;
    finishedRef.current = true;
    setResult({ outcome: "loss", reason: "by resignation", endReason: "resignation" });
    playGameEndSound();
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
    undo,
    /** Undo would take something back (see undo) */
    canUndo: !result && !engineError && botUndoPlies(history, playerCode) > 0,
    submitTypedMove,
    navigation,
    orientation,
    flip,
    isPlayerTurn:
      !result && chessRef.current.turn() === playerCode && !thinking,
  };
};
