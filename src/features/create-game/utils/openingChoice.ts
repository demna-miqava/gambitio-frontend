import type { StartingOpening } from "@/features/openings/startingOpenings";

/** The opening picked on the challenge form, and the friend it was picked for */
export interface OpeningChoice {
  friendId: number | null;
  opening: StartingOpening | null;
}

export const NO_OPENING: OpeningChoice = { friendId: null, opening: null };

/**
 * The opening the form for `friendId` starts from: the one picked on it,
 * never one picked for another friend (or before leaving the form).
 */
export const startingOpeningFor = (
  choice: OpeningChoice,
  friendId: number | null
): StartingOpening | null =>
  friendId !== null && choice.friendId === friendId ? choice.opening : null;
