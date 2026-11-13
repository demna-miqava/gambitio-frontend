import { useMemo } from "react";
import {
  ArrowUpToLine,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  CornerUpLeft,
  MoreHorizontal,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useArchiveGame } from "../contexts/ArchiveGameContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BaseMoveControls,
  type MoveControl,
} from "@/features/game/components/BaseMoveControls";

export const AnalysisMoveControls = () => {
  const {
    goToStart,
    goBack,
    goForward,
    goToEnd,
    backToMainLine,
    promoteVariation,
    deleteVariation,
    resetAnalysis,
    copyPgn,
    isAtStart,
    isAtEnd,
    isInVariation,
    hasAnalysis,
    root,
  } = useArchiveGame();

  const controls = useMemo<MoveControl[]>(
    () => [
      { id: "first", icon: ChevronsLeft, title: "Start position (Home)", onClick: goToStart, disabled: isAtStart },
      { id: "previous", icon: ChevronLeft, title: "Previous move (←)", onClick: goBack, disabled: isAtStart },
      { id: "next", icon: ChevronRight, title: "Next move (→)", onClick: goForward, disabled: isAtEnd },
      { id: "last", icon: ChevronsRight, title: "End of line (End)", onClick: goToEnd, disabled: isAtEnd },
    ],
    [goToStart, goBack, goForward, goToEnd, isAtStart, isAtEnd]
  );

  // Desktop only (phones use the menu): actions for the variation on the
  // board. Copy PGN / Clear analysis live in the panel header there.
  const variationActions = isInVariation && (
    <div className="hidden gap-1.5 lg:flex">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={backToMainLine}
        title="Go to the same move on the main line"
        className="min-w-0 flex-1"
      >
        <CornerUpLeft className="size-4" aria-hidden="true" />
        Main line
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={promoteVariation}
        title="Make this variation the main continuation"
        className="min-w-0 flex-[1.3]"
      >
        <ArrowUpToLine className="size-4" aria-hidden="true" />
        Make main line
      </Button>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={deleteVariation}
            aria-label="Delete variation"
            className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={4}>
          Delete this variation (you can undo)
        </TooltipContent>
      </Tooltip>
    </div>
  );

  const moreMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-lg"
          type="button"
          variant="secondary"
          className="relative shrink-0 lg:hidden"
          aria-label="More actions"
        >
          <MoreHorizontal className="size-5" />
          {isInVariation && (
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {isInVariation && (
          <>
            <DropdownMenuItem onSelect={backToMainLine}>
              <CornerUpLeft /> Back to main line
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={promoteVariation}>
              <ArrowUpToLine /> Make main line
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={deleteVariation}>
              <Trash2 /> Delete variation
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onSelect={copyPgn} disabled={root.children.length === 0}>
          <Copy /> Copy PGN
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={resetAnalysis} disabled={!hasAnalysis}>
          <RotateCcw /> Clear analysis
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="flex flex-col gap-2">
      {variationActions}
      <div className="flex gap-1.5">
        <BaseMoveControls controls={controls} className="min-w-0 flex-1" />
        {moreMenu}
      </div>
    </div>
  );
};
