import { useState, type ReactNode } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SettingSwitch } from "@/features/settings/components/SettingSwitch";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const Group = ({ title, children }: { title: string; children: ReactNode }) => (
  <section aria-label={title}>
    <h3 className="pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
    {children}
  </section>
);

/**
 * The settings that matter while a game is on, one line each. They are the
 * same account settings as on the Settings page and save as they're flipped;
 * the board follows at once.
 */
const QuickSettings = ({ withFocusMode }: { withFocusMode: boolean }) => (
  <div className="space-y-4">
    <Group title="Board">
      <SettingSwitch compact name="soundsEnabled" label="Sounds" description="Play sounds for moves and game events" />
      <SettingSwitch
        compact
        name="showLegalMovesEnabled"
        label="Show legal moves"
        description="Mark the squares a selected piece can move to"
      />
      <SettingSwitch
        compact
        name="moveHighlightEnabled"
        label="Highlight last move"
        description="Highlight the last move played on the board"
      />
      <SettingSwitch
        compact
        name="boardCoordinatesEnabled"
        label="Coordinates"
        description="Show a to h and 1 to 8 along the edges of the board"
      />
    </Group>
    <Group title="Moves">
      <SettingSwitch
        compact
        name="premovesEnabled"
        label="Premoves"
        description="Make moves while waiting for your opponent"
      />
      <SettingSwitch
        compact
        name="autoPromoteToQueenEnabled"
        label="Always promote to queen"
        description="Promote pawns to a queen without asking"
      />
      <SettingSwitch
        compact
        name="confirmDrawResignationEnabled"
        label="Confirm resign and draw"
        description="Ask before resigning or offering a draw"
      />
    </Group>
    <Group title="Display">
      {withFocusMode && (
        <SettingSwitch
          compact
          name="focusModeEnabled"
          label="Focus mode"
          description="During a game, show only the board, the clocks and the game actions"
        />
      )}
      <SettingSwitch
        compact
        name="showRatingsDuringGameEnabled"
        label="Ratings"
        description="Show player ratings next to names while you play"
      />
      <SettingSwitch
        compact
        name="pieceIconNotationEnabled"
        label="Piece icons in moves"
        description="Use piece symbols instead of letters in move lists"
      />
    </Group>
  </div>
);

interface GameSettingsButtonProps {
  /** Offer focus mode too (live games; it does nothing elsewhere) */
  withFocusMode?: boolean;
  className?: string;
}

/**
 * A small gear on game pages: the board and gameplay settings without
 * leaving the game. A popover beside the button from 768px, a sheet from the
 * bottom on phones.
 */
export const GameSettingsButton = ({ withFocusMode = false, className }: GameSettingsButtonProps) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const trigger = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Game settings"
      title="Game settings"
      className={cn(className)}
    >
      <Settings2 className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
    </Button>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent
          side="bottom"
          className="max-h-[80dvh] gap-0 rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="pb-2">
            <SheetTitle className="font-display text-base">Game settings</SheetTitle>
            <SheetDescription className="sr-only">Changes are saved as you make them.</SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto px-4">
            <QuickSettings withFocusMode={withFocusMode} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={12}
        aria-label="Game settings"
        className="max-h-(--radix-popover-content-available-height) w-72 overflow-y-auto rounded-xl"
      >
        <QuickSettings withFocusMode={withFocusMode} />
      </PopoverContent>
    </Popover>
  );
};
