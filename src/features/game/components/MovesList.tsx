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
export const MovesList = () => {
  // The board's shared move list: a new array whenever the line changes,
  // including server resyncs that replace moves without changing the count
  const { moves } = useChessBoardContext();
  const { currentIndex, goToMove } = useGameNavigation();
  return (
    <SettingsMovesListView moves={moves} activeIndex={currentIndex - 1} onSelect={goToMove} />
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
export const MovesListView = ({ moves, activeIndex, onSelect, showIcons = false }: MovesListViewProps) => {
  const stripRef = useRef<HTMLOListElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const movePairs = groupMovesIntoPairs(moves);
  const showSheet = useMediaQuery(SHEET_QUERY);

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
      <p className="py-3 text-center text-sm text-muted-foreground lg:py-10">
        Moves will appear here.
      </p>
    );
  }

  const renderMove = (move: Move | null, index: number) => {
    if (!move) return <span />;
    const active = index === activeIndex;
    const moveNumber = Math.floor(index / 2) + 1;
    const side = index % 2 === 0 ? "White" : "Black";
    return (
      <button
        type="button"
        data-active={active}
        aria-current={active ? "step" : undefined}
        onClick={() => onSelect(index + 1)}
        className={cn(
          "relative min-h-8 rounded-sm px-2 py-1 text-left text-sm tabular-nums transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
          // The move on the board is set in ink, like a marked line on a scoresheet
          active
            ? "bg-foreground text-background"
            : "text-foreground hover:bg-accent"
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
      className="relative hidden max-h-[min(420px,calc(100svh-26rem))] min-h-40 overflow-y-auto lg:block"
    >
      <ol className="grid grid-cols-[2.5rem_1fr_1fr] gap-y-0.5 text-sm" aria-label="Moves">
        {movePairs.map((pair) => {
          const whiteIndex = (pair.moveNumber - 1) * 2;
          return (
            <li key={pair.moveNumber} className="contents">
              <span
                className="flex items-center text-xs tabular-nums text-muted-foreground"
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
          {index % 2 === 0 && (
            <span
              className="pl-1.5 text-xs tabular-nums text-muted-foreground"
              aria-hidden="true"
            >
              {index / 2 + 1}.
            </span>
          )}
          {renderMove(move, index)}
        </li>
      ))}
    </ol>
  );
};
