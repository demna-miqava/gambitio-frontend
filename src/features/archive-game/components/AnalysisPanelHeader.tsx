import type { LucideIcon } from "lucide-react";
import { Copy, Download, FileUp, MoreHorizontal, RotateCcw } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useArchiveGame } from "../contexts/ArchiveGameContext";

interface IconActionProps {
  icon: LucideIcon;
  label: string;
  /** Longer tooltip text; defaults to the label */
  hint?: string;
  onClick: () => void;
  disabled?: boolean;
}

/** 36px icon button with a tooltip and an accessible name. */
const IconAction = ({ icon: Icon, label, hint, onClick, disabled = false }: IconActionProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className="text-muted-foreground hover:text-foreground disabled:opacity-40"
      >
        <Icon aria-hidden="true" />
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

  return (
    <div className={cn("h-13 shrink-0 items-center gap-1 border-b border-border/70 pr-3 pl-4", className)}>
      <h2 className="mr-auto truncate text-sm font-semibold text-foreground">Analysis</h2>

      <div className="flex items-center">
        <IconAction icon={Copy} label="Copy PGN" hint="Copy PGN with variations" onClick={copyPgn} disabled={noMoves} />
        <IconAction
          icon={RotateCcw}
          label="Clear analysis"
          hint="Remove your analysis moves (you can undo)"
          onClick={resetAnalysis}
          disabled={!hasAnalysis}
        />
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="More actions"
                  className="text-muted-foreground hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-foreground"
                >
                  <MoreHorizontal aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>
              More actions
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-48">
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

      <span className="mx-1.5 h-5 w-px shrink-0 bg-border" aria-hidden="true" />

      <div className="flex shrink-0 items-center gap-2">
        <Label htmlFor="engine-toggle" className="text-sm font-normal text-muted-foreground">
          Engine
        </Label>
        <Switch id="engine-toggle" checked={engineEnabled} onCheckedChange={setEngineEnabled} />
      </div>
    </div>
  );
};
