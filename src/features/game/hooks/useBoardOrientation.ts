import { useCallback, useState, type RefObject } from "react";
import type { Api } from "@lichess-org/chessground/api";
import type { PlayerColor } from "../types/game.types";

/**
 * Which side of a chessground board is at the bottom, for the parts drawn
 * around it (player rows, clocks, promotion picker, evaluation bar).
 *
 * flip turns the board around; it only changes the view, never which side
 * the player moves. setOrientation is for code that puts a side at the
 * bottom itself (a new puzzle, a retry): set it through here, not with
 * cg.set({ orientation }), so the rows around the board turn with it.
 */
export const useBoardOrientation = (cgRef: RefObject<Api | null>, initial: PlayerColor) => {
  const [orientation, setOrientationState] = useState<PlayerColor>(initial);

  const flip = useCallback(() => {
    const cg = cgRef.current;
    if (!cg) return;
    cg.toggleOrientation();
    // The board's own value, in case something else turned it
    setOrientationState(cg.state.orientation);
  }, [cgRef]);

  const setOrientation = useCallback(
    (side: PlayerColor) => {
      cgRef.current?.set({ orientation: side });
      setOrientationState(side);
    },
    [cgRef]
  );

  return { orientation, flip, setOrientation };
};
