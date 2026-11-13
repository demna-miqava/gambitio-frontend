import { useCallback } from "react";
import type { Chess, Move, Square, PieceSymbol } from "chess.js";
import type { Api } from "@lichess-org/chessground/api";
import type { Key } from "@lichess-org/chessground/types";
import type { PlayerColor } from "../types/game.types";
import { syncBoard } from "../utils/board-utils";

type MoveInput = {
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
};

interface UseBoardMoveHandlerOptions {
  chessRef: React.RefObject<Chess>;
  cgRef: React.RefObject<Api | null>;
  movableColor: PlayerColor | "both";
  setTurn: (turn: PlayerColor) => void;
  playSoundForMove?: (move: Move, isCheckmate: boolean) => void;
}

interface ApplyMoveOptions {
  chess?: Chess;
  /** Highlighted squares; defaults to the move's own from/to */
  lastMove?: [Key, Key];
  playPremove?: boolean;
}

export const useBoardMoveHandler = ({
  chessRef,
  cgRef,
  movableColor,
  setTurn,
  playSoundForMove,
}: UseBoardMoveHandlerOptions) => {
  const applyMove = useCallback(
    (
      moveInput: MoveInput,
      { chess: chessOverride, lastMove, playPremove = true }: ApplyMoveOptions = {}
    ) => {
      const chess = chessOverride ?? chessRef.current;
      const cg = cgRef.current;
      if (!chess || !cg) return null;

      try {
        const move = chess.move(moveInput);
        if (!move) return null;

        const isCheckmate = chess.isCheckmate();
        const isStalemate = chess.isStalemate();

        const turn = syncBoard({
          cg,
          chess,
          movableColor,
          lastMove: lastMove ?? [move.from, move.to],
          playPremove,
        });
        setTurn(turn);

        if (playSoundForMove) {
          playSoundForMove(move, isCheckmate);
        }

        return { move, isCheckmate, isStalemate };
      } catch {
        cg.set({ fen: chess.fen() });
        return null;
      }
    },
    [chessRef, cgRef, movableColor, setTurn, playSoundForMove]
  );

  return { applyMove };
};
