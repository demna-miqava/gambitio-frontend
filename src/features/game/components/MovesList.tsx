import { useEffect, useRef } from "react";
import type { Move } from "chess.js";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { useGameNavigation } from "@/features/game/contexts/GameNavigationContext";
import { useSettings } from "@/features/settings/SettingsContext";
import { renderMoveNotation } from "@/features/game/utils/notationUtils";
import { groupMovesIntoPairs } from "@/features/game/utils/moveListUtils";
import { cn } from "@/lib/utils";
import { scrollIntoContainer } from "@/utils/scrollIntoContainer";
import { useMediaQuery } from "@/hooks/use-mobile";

/** Tailwind's lg breakpoint, where the strip gives way to the score sheet */
const SHEET_QUERY = "(min-width: 64rem)";

/**
 * Move list for a game played on a ChessBoardProvider + GameNavigationProvider
 * (live game, and any page that uses the same providers).
 */
export const MovesList = ({ fill = false }: { fill?: boolean }) => {
  // The board's shared move list: a new array whenever the line changes,
  // including server resyncs that replace moves without changing the count
  const { moves } = useChessBoardContext();
  const { currentIndex, goToMove } = useGameNavigation();
  return (
    <SettingsMovesListView
      moves={moves}
      activeIndex={currentIndex - 1}
      onSelect={goToMove}
      fill={fill}
    />
  );
};

/** MovesListView with the signed-in user's notation setting (inside the app shell). */
export const SettingsMovesListView = (props: Omit<MovesListViewProps, "showIcons">) => {
  const { settings } = useSettings();
  return <MovesListView {...props} showIcons={settings?.pieceIconNotationEnabled ?? false} />;
};

interface MovesListViewProps {
  moves: Move[];
  /** Index of the move whose position is on the board (-1 = start) */
  activeIndex: number;
  /** Called with the number of moves to show (index + 1) */
  onSelect: (moveCount: number) => void;
  /** Figurines instead of piece letters (the account's notation setting) */
  showIcons?: boolean;
  /**
   * Half-moves played before the first of `moves`, for a position set up
   * mid-game: numbering starts there, and with an odd one black moves first
   */
  startPly?: number;
  /**
   * The score sheet takes the height its parent gives it (a flex item with
   * min-h-0) and scrolls inside, instead of capping its own height
   */
  fill?: boolean;
}

/**
 * Phones get a single scrolling strip under the board; larger screens get a
 * two-column score sheet. Tapping a move shows the position after it.
 * Only the one for the screen is rendered (read before the first paint), so
 * long games don't keep two copies of the list in the page.
 *
 * Reads no account settings itself, so it also works on pages without a
 * signed-in user (a shared game); SettingsMovesListView adds them.
 */
export const MovesListView = ({
  moves,
  activeIndex,
  onSelect,
  showIcons = false,
  startPly = 0,
  fill = false,
}: MovesListViewProps) => {
  const stripRef = useRef<HTMLOListElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const movePairs = groupMovesIntoPairs(moves, startPly);
  const wide = useMediaQuery(SHEET_QUERY);
  // A caller that gives the list its height has the room for the sheet
  const showSheet = fill || wide;

  // Keep the newest / selected move in view
  useEffect(() => {
    scrollIntoContainer(
      stripRef.current?.querySelector<HTMLElement>('[data-active="true"]')
    );
    const sheet = sheetRef.current;
    const sheetActive = sheet?.querySelector<HTMLElement>('[data-active="true"]');
    if (sheet && sheetActive) {
      const top = sheetActive.offsetTop - sheet.clientHeight / 2;
      sheet.scrollTo({ top: Math.max(0, top) });
    }
  }, [activeIndex, moves.length, showSheet]);

  if (moves.length === 0) {
    return (
      <p
        className={cn(
          "text-center text-[13px] text-faint",
          fill ? "grid h-full place-items-center px-6" : "py-3 lg:py-10"
        )}
      >
        The moves will appear here as you play.
      </p>
    );
  }

  const renderMove = (move: Move | null, index: number) => {
    if (!move) return <span />;
    const active = index === activeIndex;
    const ply = startPly + index;
    const moveNumber = Math.floor(ply / 2) + 1;
    const side = ply % 2 === 0 ? "White" : "Black";
    return (
      <button
        type="button"
        data-active={active}
        aria-current={active ? "step" : undefined}
        onClick={() => onSelect(index + 1)}
        className={cn(
          "relative min-h-8 rounded-[5px] px-2.5 py-1 text-left text-sm font-[550] tabular-nums transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
          // The move on the board: the one place the accent goes in the list
          active
            ? "bg-primary-soft font-bold text-primary"
            : "text-foreground hover:bg-hover"
        )}
      >
        {/* Keeps the visible SAN in the accessible name */}
        <span className="sr-only">{`${moveNumber}. ${side}: `}</span>
        {renderMoveNotation(move, showIcons)}
      </button>
    );
  };

  return showSheet ? (
    // Desktop: score sheet
    <div
      ref={sheetRef}
      className={cn(
        "relative overflow-y-auto [scrollbar-width:thin]",
        fill ? "h-full" : "hidden max-h-[min(420px,calc(100svh-26rem))] min-h-40 lg:block"
      )}
    >
      <ol className="grid grid-cols-[2.5rem_1fr_1fr] gap-x-0.5 text-sm" aria-label="Moves">
        {movePairs.map((pair) => {
          const whiteIndex = (pair.moveNumber - 1) * 2 - startPly;
          return (
            <li key={pair.moveNumber} className="contents">
              <span
                className="flex items-center pl-2 text-[13px] tabular-nums text-faint"
                aria-hidden="true"
              >
                {pair.moveNumber}.
              </span>
              {renderMove(pair.white, whiteIndex)}
              {renderMove(pair.black, whiteIndex + 1)}
            </li>
          );
        })}
      </ol>
    </div>
  ) : (
    // Phones: horizontal strip
    <ol
      ref={stripRef}
      className="scrollbar-none flex items-center gap-0.5 overflow-x-auto whitespace-nowrap lg:hidden"
      aria-label="Moves"
    >
      {moves.map((move, index) => (
        <li key={index} className="flex items-center">
          {((startPly + index) % 2 === 0 || index === 0) && (
            <span
              className="pl-1.5 text-xs tabular-nums text-muted-foreground"
              aria-hidden="true"
            >
              {/* "6…" when black's move opens the list */}
              {Math.floor((startPly + index) / 2) + 1}
              {(startPly + index) % 2 === 0 ? "." : "…"}
            </span>
          )}
          {renderMove(move, index)}
        </li>
      ))}
    </ol>
  );
};
