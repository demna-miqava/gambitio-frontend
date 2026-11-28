/**
 * Link state for "Add a friend": the friends page opens with its search
 * focused, ready to type a username (the search also finds players who
 * aren't friends yet).
 */
export const FIND_PLAYER_STATE = { findPlayer: true } as const;

export const wantsFindPlayer = (state: unknown) =>
  (state as { findPlayer?: boolean } | null)?.findPlayer === true;
