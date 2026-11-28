import { PLAY_TIME_CONTROLS } from "@/features/create-game/constants/timeControls";

export type QuickTimeControl = { time: number; increment: number; label: string };

/** The nine time controls New game offers, fastest first */
export const QUICK_TIME_CONTROLS: QuickTimeControl[] = PLAY_TIME_CONTROLS.flatMap(
  (speed) => speed.options
);

/** What a player with no games yet is pointed at: time to think */
export const FIRST_GAME: QuickTimeControl = QUICK_TIME_CONTROLS.find(
  ({ time, increment }) => time === 600 && increment === 0
)!;

/**
 * The time control played most among `games` (the most recent ones), out of
 * the nine New game offers; the more recent one on a tie. Null when none of
 * the games was played at one of them.
 */
export const usualTimeControl = (
  games: readonly { time: number | null; increment: number | null }[]
): QuickTimeControl | null => {
  let best: QuickTimeControl | null = null;
  let bestCount = 0;
  const counts = new Map<string, number>();
  // Oldest first, so that on a tie the later (more recent) one wins
  for (const game of [...games].reverse()) {
    const control = QUICK_TIME_CONTROLS.find(
      ({ time, increment }) => time === game.time && increment === (game.increment ?? 0)
    );
    if (!control) continue;
    const count = (counts.get(control.label) ?? 0) + 1;
    counts.set(control.label, count);
    if (count >= bestCount) {
      best = control;
      bestCount = count;
    }
  }
  return best;
};
