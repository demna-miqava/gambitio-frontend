import { Minimize2 } from "lucide-react";
import { useGameShell } from "@/context/GameShellContext";
import { useSettings } from "@/features/settings/SettingsContext";

/**
 * While a game is played in focus mode, from 768px (phones keep the button
 * in the top bar): the way back out, in the bottom left corner. It says what
 * this is and how to leave for five seconds, then only the button is left.
 */
export const FocusHint = () => {
  const { focusActive } = useGameShell();
  const { updateSettings } = useSettings();
  if (!focusActive) return null;

  return (
    <div className="fixed bottom-4 left-4 z-30 hidden items-center gap-1.5 text-[13px] text-muted-foreground md:flex">
      <button
        type="button"
        onClick={() => updateSettings.mutate({ focusModeEnabled: false })}
        aria-label="Leave focus mode"
        aria-keyshortcuts="Z Escape"
        title="Leave focus mode (Z or Esc)"
        className="grid size-9 place-items-center rounded-md border border-border bg-card text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Minimize2 className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
      </button>
      <p
        role="status"
        className="flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 [animation:focus-hint-out_400ms_5s_forwards] motion-reduce:[animation-duration:1ms]"
      >
        Focus mode. Press
        <kbd className="rounded-[4px] border border-border-strong px-1.5 font-sans text-xs font-semibold text-foreground">
          Z
        </kbd>
        or
        <kbd className="rounded-[4px] border border-border-strong px-1.5 font-sans text-xs font-semibold text-foreground">
          Esc
        </kbd>
        to leave.
      </p>
    </div>
  );
};
