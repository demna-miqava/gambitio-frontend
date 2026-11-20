import { useCallback, useEffect, useRef, useState } from "react";
import { Chess, type Move, type PieceSymbol, type Square } from "chess.js";
import { Chessground } from "@lichess-org/chessground";
import type { Api } from "@lichess-org/chessground/api";
import type { Key } from "@lichess-org/chessground/types";
import { calculateLegalMoves } from "@/features/game/utils/board-utils";
import { attachTouchDragAssist } from "@/features/game/utils/touchDragAssist";
import { isPromotionMove } from "@/features/game/utils/promotionUtils";
import { parseTypedMove } from "@/features/game/utils/parseTypedMove";
import { useChessSound } from "@/features/game/contexts/ChessSoundContext";
import { useSettings } from "@/features/settings/SettingsContext";
import { BOARD_SETTING_DEFAULTS } from "@/features/play-bots/hooks/useBotGame";
import type { RepertoireLine } from "@/services/repertoire";
import { isPlayerPly, moveSquares, otherLinePlaying } from "../utils/drill";
import { formatMoves } from "../utils/lines";
import { useBoardOrientation } from "@/features/game/hooks/useBoardOrientation";

/** Pause before the opponent's reply, so the player sees their own move land. */
const REPLY_DELAY_MS = 450;

export type DrillFeedback =
  | { kind: "correct"; san: string }
  /** A move from another line: retry without it counting against the run */
  | { kind: "other_line"; san: string; lineName: string }
  | { kind: "wrong"; san: string; expected: string }
  | { kind: "hint"; expected: string };

export type DrillStatus = "playing" | "done";

const moveLabel = (ply: number, san: string) =>
  `${Math.floor(ply / 2) + 1}${ply % 2 === 0 ? "." : "..."} ${san}`;

/**
 * Practising one line: the opponent's moves play themselves, the player has
 * to find their own. A wrong move is shown (arrow) and fails the run, but
 * the player still finishes the line; a move from another of their lines of
 * the same colour doesn't count against them. `onFinish` is called once,
 * with whether the line was recalled without a mistake.
 */
export const useLineDrill = (
  line: RepertoireLine,
  allLines: readonly RepertoireLine[],
  onFinish: (correct: boolean) => void
) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  // The line's colour at the bottom until the player flips the board
  const { orientation, flip } = useBoardOrientation(cgRef, line.color);
  const chessRef = useRef(new Chess());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const { playSound } = useChessSound();
  const { settings } = useSettings();
  const coordinates = settings?.boardCoordinatesEnabled ?? BOARD_SETTING_DEFAULTS.boardCoordinatesEnabled;
  const highlight = settings?.moveHighlightEnabled ?? BOARD_SETTING_DEFAULTS.moveHighlightEnabled;
  const showDests = settings?.showLegalMovesEnabled ?? BOARD_SETTING_DEFAULTS.showLegalMovesEnabled;

  const [ply, setPly] = useState(0);
  const [failed, setFailed] = useState(false);
  const [status, setStatus] = useState<DrillStatus>("playing");
  const [feedback, setFeedback] = useState<DrillFeedback | null>(null);
  const [announcement, setAnnouncement] = useState("");
  // Mirrors of state for the board callbacks, which outlive renders
  const plyRef = useRef(0);
  const failedRef = useRef(false);
  const doneRef = useRef(false);

  const playerTurn = useCallback((p: number) => p < line.moves.length && isPlayerPly(line.color, p), [line]);

  /** Shows the drill's current position; the player may move when it's their turn. */
  const syncBoard = useCallback(
    (lastMove?: [Key, Key]) => {
      const cg = cgRef.current;
      if (!cg) return;
      const chess = chessRef.current;
      const mine = !doneRef.current && playerTurn(plyRef.current);
      cg.set({
        fen: chess.fen(),
        turnColor: chess.turn() === "w" ? "white" : "black",
        check: chess.inCheck(),
        ...(lastMove && { lastMove }),
        movable: { color: mine ? line.color : undefined, dests: mine ? calculateLegalMoves(chess) : new Map() },
      });
    },
    [line.color, playerTurn]
  );

  const showArrow = useCallback((san: string | null) => {
    const cg = cgRef.current;
    if (!cg) return;
    const squares = san ? moveSquares(chessRef.current.fen(), san) : null;
    cg.setAutoShapes(squares ? [{ orig: squares.from as Key, dest: squares.to as Key, brush: "green" }] : []);
  }, []);

  const sound = useCallback(
    (move: Move) => playSound(move.san.includes("#") ? "gameEnd" : move.captured ? "capture" : "move"),
    [playSound]
  );

  const finish = useCallback(() => {
    doneRef.current = true;
    setStatus("done");
    syncBoard();
    const correct = !failedRef.current;
    setAnnouncement(
      correct ? `Line complete. You recalled ${line.name} perfectly.` : `Line complete, with mistakes.`
    );
    finishRef.current(correct);
  }, [line.name, syncBoard]);

  /** Plays the line's next move on the board (either side). */
  const advance = useCallback((): Move | null => {
    const chess = chessRef.current;
    const san = line.moves[plyRef.current];
    if (!san) return null;
    let move: Move;
    try {
      move = chess.move(san);
    } catch {
      return null;
    }
    plyRef.current += 1;
    setPly(plyRef.current);
    syncBoard([move.from as Key, move.to as Key]);
    sound(move);
    return move;
  }, [line.moves, sound, syncBoard]);

  /** Plays opponent moves until it's the player's turn or the line ends. */
  const continueLine = useCallback(
    (prefix = "") => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (plyRef.current >= line.moves.length) {
        finish();
        return;
      }
      if (playerTurn(plyRef.current)) {
        if (prefix) setAnnouncement(`${prefix} Your move.`);
        return;
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const at = plyRef.current;
        const move = advance();
        if (!move) return;
        const said = `${prefix ? `${prefix} ` : ""}Opponent played ${moveLabel(at, move.san)}.`;
        if (plyRef.current >= line.moves.length) {
          setAnnouncement(said);
          finish();
        } else if (playerTurn(plyRef.current)) {
          setAnnouncement(`${said} Your move.`);
        } else {
          continueLine(said);
        }
      }, REPLY_DELAY_MS);
    },
    [advance, finish, line.moves.length, playerTurn]
  );

  const onPlayerMove = useCallback(
    (from: Square, to: Square, typedPromotion?: PieceSymbol) => {
      if (doneRef.current || !playerTurn(plyRef.current)) return;
      const chess = chessRef.current;
      const expected = line.moves[plyRef.current]!;
      const at = plyRef.current;
      // A typed promotion keeps its piece; a board one takes the line's piece
      // when the squares match, else a queen
      const piece = chess.get(from);
      const expectedSquares = moveSquares(chess.fen(), expected);
      const promotion = !isPromotionMove(to, piece)
        ? undefined
        : typedPromotion
          ? typedPromotion
          : expectedSquares?.from === from && expectedSquares.to === to
            ? (expected.match(/=([QRBN])/)?.[1]?.toLowerCase() ?? "q")
            : "q";
      let san: string;
      try {
        san = new Chess(chess.fen()).move({ from, to, ...(promotion ? { promotion } : {}) }).san;
      } catch {
        syncBoard();
        return;
      }

      if (san === expected) {
        showArrow(null);
        advance();
        setFeedback({ kind: "correct", san });
        continueLine(`${moveLabel(at, san)} is right.`);
        return;
      }

      // Put the piece back: the line hasn't moved on
      syncBoard();
      const other = otherLinePlaying(allLines, line, chess.fen(), san);
      if (other) {
        setFeedback({ kind: "other_line", san, lineName: other.name });
        setAnnouncement(`${san} is your ${other.name} line. This drill follows ${line.name}. Try again.`);
        return;
      }
      failedRef.current = true;
      setFailed(true);
      setFeedback({ kind: "wrong", san, expected });
      showArrow(expected);
      setAnnouncement(`${san} isn't in this line. The line plays ${moveLabel(at, expected)}. Play it to continue.`);
    },
    [advance, allLines, continueLine, line, playerTurn, showArrow, syncBoard]
  );

  // Board setup, once per line (the practice view remounts for a new line)
  useEffect(() => {
    if (!boardRef.current) return;
    const chess = new Chess();
    chessRef.current = chess;
    const cg = Chessground(boardRef.current, {
      fen: chess.fen(),
      orientation: line.color,
      coordinates,
      highlight: { lastMove: highlight, check: true },
      draggable: { enabled: true },
      premovable: { enabled: false },
      movable: { free: false, showDests, color: undefined, dests: new Map() },
    });
    cgRef.current = cg;
    const detach = attachTouchDragAssist(cg);
    syncBoard();
    continueLine(`Practising ${line.name}, as ${line.color}.`);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      detach();
      cg.destroy();
      cgRef.current = null;
    };
    // Set up once per line; settings changes are applied below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cgRef.current?.set({
      coordinates,
      highlight: { lastMove: highlight, check: true },
      movable: { showDests },
    });
  }, [coordinates, highlight, showDests]);

  useEffect(() => {
    cgRef.current?.set({
      movable: { events: { after: (orig, dest) => onPlayerMove(orig as Square, dest as Square) } },
    });
  }, [onPlayerMove]);

  /** Shows the move to play (an arrow); the run then counts as a miss. */
  const showHint = useCallback(() => {
    if (doneRef.current || !playerTurn(plyRef.current)) return;
    const expected = line.moves[plyRef.current]!;
    failedRef.current = true;
    setFailed(true);
    setFeedback({ kind: "hint", expected });
    showArrow(expected);
    setAnnouncement(`The line plays ${moveLabel(plyRef.current, expected)}.`);
  }, [line.moves, playerTurn, showArrow]);

  /** Plays the move the player has to find (keyboard or typed input). */
  const submitTypedMove = useCallback(
    (text: string): string | null => {
      if (doneRef.current) return "The line is finished.";
      if (!playerTurn(plyRef.current)) return "Wait for your opponent's move.";
      const move = parseTypedMove(chessRef.current, text);
      if (!move) return `"${text.trim()}" isn't a legal move here.`;
      onPlayerMove(move.from, move.to, move.promotion);
      return null;
    },
    [onPlayerMove, playerTurn]
  );

  const isPlayerTurn = status === "playing" && playerTurn(ply);

  return {
    boardRef,
    ply,
    failed,
    status,
    feedback,
    announcement,
    isPlayerTurn,
    playedMoves: line.moves.slice(0, ply),
    /** Text of the moves played so far */
    playedText: formatMoves(line.moves.slice(0, ply)),
    showHint,
    submitTypedMove,
    orientation,
    flip,
  };
};
