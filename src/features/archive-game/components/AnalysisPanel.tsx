import { useEffect, useId, useMemo, useState } from "react";
import { BookMarked, ChevronDown, ChevronUp, UsersRound } from "lucide-react";
import type { Key } from "@lichess-org/chessground/types";
import { EngineAnalysisPanel, formatScore, useAnalysis } from "@/features/engine-analysis";
import {
  GameModeMoveControls,
  GameModeMovesList,
} from "@/features/game/modes/GameModeContext";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { useFlipBoardKey } from "@/features/game/hooks/useFlipBoardKey";
import { useArchiveGame } from "@/features/archive-game/contexts/ArchiveGameContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { MoveStrip } from "./MoveStrip";
import { GameReviewSection } from "@/features/game-review/components/GameReviewSection";
import { GameReviewPanel } from "@/features/game-review/components/GameReviewPanel";
import { useGameReview } from "@/features/game-review/contexts/GameReviewContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AnalysisPanelHeader } from "./AnalysisPanelHeader";
import { TypedMoveInput } from "@/features/game/components/TypedMoveInput";
import { cn } from "@/lib/utils";
import { OpeningName } from "@/features/openings";
import { nodesAlong } from "../utils/analysisTree";
import { useLineActions } from "../hooks/useLineActions";
import { ShareGifButton } from "@/features/share-gif";
import { ShareLinkButton, useShareLink } from "@/features/shared-game";

/** Phones: the desktop header (with these in its menu) is hidden */
const MobileLineActions = () => {
  const { canSaveLine, openRepertoire, openStudy, dialogs } = useLineActions();
  const shareLink = useShareLink();
  return (
    <div className="order-6 grid grid-cols-2 gap-2 lg:hidden">
      <Button variant="outline" size="md" onClick={openRepertoire} disabled={!canSaveLine}>
        <BookMarked aria-hidden="true" /> Save line
      </Button>
      <Button variant="outline" size="md" onClick={openStudy}>
        <UsersRound aria-hidden="true" /> Study together
      </Button>
      {/* The viewer's own finished games: a link anyone can open */}
      <ShareLinkButton />
      {/* Finished games only */}
      <ShareGifButton className={shareLink ? undefined : "col-span-2"} />
      {dialogs}
    </div>
  );
};

/** Phone engine header: toggle, current evaluation and depth on one row. */
const EngineStrip = ({ fen }: { fen: string }) => {
  const { engineEnabled, setEngineEnabled, analysis } = useAnalysis();
  const best = analysis.fen === fen ? analysis.lines[0] : undefined;

  return (
    <div className="flex items-center gap-3 lg:hidden">
      <Switch
        id="engine-toggle-mobile"
        checked={engineEnabled}
        onCheckedChange={setEngineEnabled}
        aria-label="Engine"
      />
      <Label
        htmlFor="engine-toggle-mobile"
        className="h-7 min-w-16 text-sm font-medium"
      >
        {engineEnabled ? (
          <span className="text-lg font-medium tabular-nums">
            {best ? formatScore(best, "white") : "…"}
          </span>
        ) : (
          "Engine"
        )}
      </Label>
      {engineEnabled && (
        <span className="ml-auto flex items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
          <Loader2
            className={cn("size-3 animate-spin", !analysis.isAnalyzing && "invisible")}
            aria-hidden="true"
          />
          Depth {analysis.depth}
        </span>
      )}
    </div>
  );
};

/** Draws the engine's best move as an arrow on the board. */
const useBestMoveArrow = (fen: string) => {
  const { cgRef } = useChessBoardContext();
  const { engineEnabled, analysis } = useAnalysis();
  const best = engineEnabled && analysis.fen === fen ? analysis.lines[0]?.pv[0] : undefined;

  useEffect(() => {
    const cg = cgRef.current;
    if (!cg) return;
    cg.setAutoShapes(
      best
        ? [{ orig: best.slice(0, 2) as Key, dest: best.slice(2, 4) as Key, brush: "paleBlue" }]
        : []
    );
  }, [cgRef, best]);
};

/** Expands the single engine line shown while a review is ready to three. */
const MoreLinesToggle = ({
  expanded,
  onToggle,
  controls,
}: {
  expanded: boolean;
  onToggle: () => void;
  controls: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={controls}
        aria-label={expanded ? "Show one engine line" : "Show three engine lines"}
        // As tall as an engine line
        className="h-[38px] w-8 text-muted-foreground hover:text-foreground"
      >
        <ChevronDown
          className={cn(
            "transition-transform duration-200 motion-reduce:transition-none",
            expanded && "rotate-180"
          )}
          aria-hidden="true"
        />
      </Button>
    </TooltipTrigger>
    <TooltipContent side="left" sideOffset={4}>
      {expanded ? "Fewer lines" : "More lines"}
    </TooltipContent>
  </Tooltip>
);

/**
 * Side panel for reviewing a game.
 *
 * Phones (Lichess-style): move controls right under the board, a one-row
 * engine strip with one-line variations, then the current line as a single
 * scrolling row (the full move tree is one tap away), the game review, and
 * "Load another PGN".
 *
 * Desktop: exactly as tall as the board column (GameLayout's fitPanel) and
 * only the move list scrolls. Top to bottom: header (actions, engine
 * switch), the game review, the engine lines (one, expandable, once the
 * review is ready), the move list, the move controls.
 *
 * One DOM tree for both, rearranged with CSS order, so the engine panel is
 * rendered once and there's a single Stockfish worker.
 */
export const AnalysisPanel = ({ onLoadAnotherPgn }: { onLoadAnotherPgn?: () => void }) => {
  const { engineEnabled } = useAnalysis();
  const { currentNode, playUci, submitTypedMove, root, path } = useArchiveGame();
  const lineFens = useMemo(() => nodesAlong(root, path).map((node) => node.fen), [root, path]);
  const review = useGameReview();
  const reviewReady = review?.status === "ready";
  const [showAllMoves, setShowAllMoves] = useState(false);
  const [moreLines, setMoreLines] = useState(false);
  const linesId = useId();
  useBestMoveArrow(currentNode.fen);
  const { flipBoard } = useChessBoardContext();
  useFlipBoardKey(flipBoard);

  return (
    <div className="flex w-full flex-col gap-3 lg:h-full lg:min-h-0 lg:gap-0 lg:overflow-hidden lg:rounded-2xl lg:bg-card">
      <AnalysisPanelHeader onLoadAnotherPgn={onLoadAnotherPgn} className="hidden lg:order-1 lg:flex" />

      {/* Desktop review: always visible above the moves. Renders nothing
          where no review is offered (e.g. the analysis board) */}
      <GameReviewPanel className="hidden shrink-0 border-b border-border lg:order-2 lg:block" />

      <div className="order-1 space-y-2 lg:order-5 lg:shrink-0 lg:border-t lg:border-border lg:p-3">
        <GameModeMoveControls />
        {/* Keyboard play; appears when it gets focus */}
        <TypedMoveInput onSubmit={submitTypedMove} />
      </div>

      <div className="order-2 lg:hidden">
        <EngineStrip fen={currentNode.fen} />
      </div>

      {engineEnabled && (
        <div className="order-3 lg:shrink-0 lg:border-b lg:border-border lg:px-3 lg:py-2.5">
          <EngineAnalysisPanel
            numLines={3}
            fen={currentNode.fen}
            onPlayMove={playUci}
            compactOnMobile
            id={linesId}
            // The review runs its own Stockfish; one engine at a time
            paused={review?.status === "running"}
            {...(reviewReady && {
              hideDesktopHeader: true,
              desktopVisibleLines: moreLines ? 3 : 1,
              desktopToggle: (
                <MoreLinesToggle
                  expanded={moreLines}
                  onToggle={() => setMoreLines((v) => !v)}
                  controls={linesId}
                />
              ),
            })}
          />
        </div>
      )}

      <div className="order-4 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        <OpeningName
          fens={lineFens}
          className="px-1 pb-2 lg:shrink-0 lg:border-b lg:border-border lg:px-4 lg:py-2.5"
        />
        <div className={cn("lg:hidden", showAllMoves && "hidden")}>
          <div className="rounded-xl bg-card px-1">
            <MoveStrip />
          </div>
        </div>
        <div className={cn("lg:flex lg:min-h-0 lg:flex-1 lg:flex-col", showAllMoves ? "block" : "hidden")}>
          <GameModeMovesList />
        </div>
        <button
          type="button"
          onClick={() => setShowAllMoves((v) => !v)}
          className="mt-1 flex min-h-11 w-full items-center justify-center gap-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          aria-expanded={showAllMoves}
        >
          {showAllMoves ? (
            <>
              Show current line <ChevronUp className="size-3.5" aria-hidden="true" />
            </>
          ) : (
            <>
              Show all moves and variations <ChevronDown className="size-3.5" aria-hidden="true" />
            </>
          )}
        </button>
      </div>

      {/* Phones: below the moves, as before */}
      <GameReviewSection className="order-5 lg:hidden" />

      <MobileLineActions />

      {onLoadAnotherPgn && (
        <div className="order-7 lg:hidden">
          <Button variant="outline" size="md" onClick={onLoadAnotherPgn} className="w-full">
            Load another PGN
          </Button>
        </div>
      )}
    </div>
  );
};
