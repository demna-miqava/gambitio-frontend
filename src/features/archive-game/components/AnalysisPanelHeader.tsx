import type { LucideIcon } from "lucide-react";
import { BookMarked, Copy, Download, FileUp, Film, FlipVertical2, Loader2, MoreHorizontal, RotateCcw, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAnalysis } from "@/features/engine-analysis";
import { useShareGif } from "@/features/share-gif";
import { useChessBoardContext } from "@/features/game/contexts/ChessBoardContext";
import { cn } from "@/lib/utils";
import { useArchiveGame } from "../contexts/ArchiveGameContext";
import { useLineActions } from "../hooks/useLineActions";

interface IconActionProps {
  icon: LucideIcon;
  label: string;
  /** Longer tooltip text; defaults to the label */
  hint?: string;
  onClick: () => void;
  disabled?: boolean;
  /** Shows a spinner while its action runs (stays focusable; the action ignores repeat clicks) */
  busy?: boolean;
}

/** 36px icon button with a tooltip and an accessible name. */
const IconAction = ({ icon: Icon, label, hint, onClick, disabled = false, busy = false }: IconActionProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-busy={busy || undefined}
        aria-disabled={busy || undefined}
        className="size-7 text-muted-foreground hover:text-foreground disabled:opacity-40"
      >
        {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Icon aria-hidden="true" />}
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom" sideOffset={4}>
      {hint ?? label}
    </TooltipContent>
  </Tooltip>
);

interface AnalysisPanelHeaderProps {
  /** Adds "Load another PGN" to the menu (the import page) */
  onLoadAnotherPgn?: () => void;
  className?: string;
}

/**
 * Desktop header of the analysis panel: title, the PGN / analysis actions as
 * icon buttons, a menu for the rest, and the engine switch.
 */
export const AnalysisPanelHeader = ({ onLoadAnotherPgn, className }: AnalysisPanelHeaderProps) => {
  const { copyPgn, downloadPgn, resetAnalysis, hasAnalysis, root } = useArchiveGame();
  const { engineEnabled, setEngineEnabled } = useAnalysis();
  const noMoves = root.children.length === 0;
  const lineActions = useLineActions();
  const { flipBoard } = useChessBoardContext();
  // Finished games only (null on the import page and the analysis board)
  const shareGif = useShareGif();

  return (
    <div className={cn("h-13 shrink-0 items-center gap-0.5 border-b border-border pr-3 pl-3.5", className)}>
      <h2 className="mr-auto truncate font-display text-base text-foreground">Analysis</h2>

      <div className="flex items-center">
        <IconAction icon={FlipVertical2} label="Flip board" hint="Flip board (F)" onClick={flipBoard} />
        <IconAction icon={Copy} label="Copy PGN" hint="Copy PGN with variations" onClick={copyPgn} disabled={noMoves} />
        <IconAction
          icon={RotateCcw}
          label="Clear analysis"
          hint="Remove your analysis moves (you can undo)"
          onClick={resetAnalysis}
          disabled={!hasAnalysis}
        />
        {shareGif && (
          <IconAction
            icon={Film}
            label={shareGif.isGenerating ? "Making GIF" : "Share GIF"}
            hint={shareGif.isGenerating ? "Making GIF…" : "Share the game as an animated GIF"}
            onClick={shareGif.shareGif}
            disabled={!shareGif.canShareGif}
            busy={shareGif.isGenerating}
          />
        )}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="More actions"
                  className="size-7 text-muted-foreground hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-foreground"
                >
                  <MoreHorizontal aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>
              More actions
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onSelect={lineActions.openRepertoire} disabled={!lineActions.canSaveLine}>
              <BookMarked /> Save line to repertoire
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={lineActions.openStudy}>
              <UsersRound /> Study with friends
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={downloadPgn} disabled={noMoves}>
              <Download /> Download PGN
            </DropdownMenuItem>
            {onLoadAnotherPgn && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onLoadAnotherPgn}>
                  <FileUp /> Load another PGN
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden="true" />

      <div className="flex shrink-0 items-center gap-2">
        <Label htmlFor="engine-toggle" className="text-sm font-normal text-muted-foreground">
          Engine
        </Label>
        <Switch id="engine-toggle" checked={engineEnabled} onCheckedChange={setEngineEnabled} />
      </div>
      {lineActions.dialogs}
    </div>
  );
};
