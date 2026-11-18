/** How close to the bottom still counts as reading the latest messages, in px */
export const NEAR_BOTTOM_PX = 32;

/** Whether a scrolled list shows its end (as the game chat decides it, ChatPanel). */
export const isNearBottom = (el: Pick<HTMLElement, "scrollHeight" | "scrollTop" | "clientHeight">): boolean =>
  el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
