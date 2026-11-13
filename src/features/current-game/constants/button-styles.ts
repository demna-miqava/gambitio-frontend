// In-game actions are quiet outline buttons; color only signals intent on hover
// and in the confirmation step, so the board stays the focus.
const base =
  "flex h-10 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

export const GAME_BUTTON_STYLES = {
  resign: `${base} border border-border bg-transparent text-foreground hover:border-loss/40 hover:bg-loss-bg hover:text-loss`,
  draw: `${base} border border-border bg-transparent text-foreground hover:bg-accent`,
  abort: `${base} w-full border border-border bg-transparent text-foreground hover:bg-accent`,
  accept: `${base} bg-primary text-primary-foreground hover:bg-primary/90`,
  decline: `${base} border border-border bg-transparent text-foreground hover:bg-accent`,
} as const;
