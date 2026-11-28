import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GameLayoutProps {
  board: ReactNode;
  sidebar: ReactNode;
  /**
   * For pages where the board is only decoration (game setup, mode pickers):
   * when the layout is stacked, show only the controls.
   */
  boardIsDecorative?: boolean;
  /** The board has no player bars above/below it, so it can be taller */
  bareBoard?: boolean;
  /**
   * From lg: the panel is exactly as tall as the board column and never
   * grows past it (its content must scroll inside, e.g. a move list with
   * flex-1 min-h-0). For panels that fill a fixed frame next to the board,
   * like the analysis panel, so the page itself never scrolls.
   */
  fitPanel?: boolean;
  /**
   * The live game's layout: the panel is one 372px rail as tall as the board
   * column, and the page never scrolls. On phones the board column and the
   * rail dissolve into one column whose parts are ordered in index.css
   * (.game-layout[data-rail]): moves, opponent, board, you, prompts, then
   * the action bar along the bottom edge.
   */
  rail?: boolean;
  /**
   * With `rail`, beside the board: the rail steps aside and the board with
   * its two player strips takes the middle of the page (focus mode)
   */
  focus?: boolean;
}

/**
 * Board + side panel, used by every page with a board. One sizing rule for
 * all of them: the board's edge is the smaller of the board column's width
 * and the viewport height left after the top bar, page padding and player
 * bars. Stacked below 768px and on portrait tablets (with room kept below
 * the board for the panel), side by side on landscape tablets and from
 * 1024px. The rule and the panel widths live in index.css (.game-layout).
 *
 * A board wrapper that puts something beside the board (the evaluation bar)
 * marks it with `game-layout-eval` so the column makes room for it.
 */
export const GameLayout = ({
  board,
  sidebar,
  boardIsDecorative = false,
  bareBoard = false,
  fitPanel = false,
  rail = false,
  focus = false,
}: GameLayoutProps) => {
  return (
    <div
      className={cn("game-layout grid grid-cols-1 gap-4", bareBoard && "lg:-my-4")}
      data-bare-board={bareBoard || undefined}
      data-decorative-board={boardIsDecorative || undefined}
      data-fit-panel={fitPanel || undefined}
      data-rail={rail || undefined}
      data-focus={(rail && focus) || undefined}
    >
      <div className="game-layout-board -mx-4 -mt-5 flex min-w-0 items-center justify-center sm:mx-0 sm:mt-0">
        {board}
      </div>
      <div className="game-layout-panel min-w-0">{sidebar}</div>
    </div>
  );
};
