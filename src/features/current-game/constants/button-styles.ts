// In-game actions are quiet light tiles on the panel; color only signals
// intent on hover and in the confirmation step, so the board stays the focus.
// The panel is a card from lg up and the bare page below, so the tile takes
// whichever surface it isn't sitting on.
const base =
  "flex h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";
const tile = `${base} bg-card text-foreground lg:bg-background`;

export const GAME_BUTTON_STYLES = {
  resign: `${tile} hover:bg-loss-bg hover:text-loss`,
  draw: `${tile} hover:bg-accent`,
  takeback: `${tile} hover:bg-accent`,
  abort: `${tile} w-full hover:bg-accent`,
  accept: `${base} bg-primary text-primary-foreground hover:bg-primary/90`,
  decline: `${tile} hover:bg-accent`,
} as const;
