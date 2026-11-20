import { useSyncExternalStore } from "react";
import type { PlayerColorOption } from "@/types/game.types";
import { userStore, type UserStore } from "@/utils/userStorage";

/**
 * The plain terms of the last challenge you sent a friend: what the
 * challenge form starts from next time, and what one tap on a friend sends
 * again. Time odds, a match format and a starting opening aren't kept: they
 * belong to the challenge they were picked for.
 */
export interface LastChallenge {
  /** Starting time per side, in seconds */
  time: number;
  increment: number;
  color: PlayerColorOption;
  rated: boolean;
}

const KEY = "last";
const COLORS: PlayerColorOption[] = ["white", "black", "random"];
// Far above anything the form offers: only keeps a hand-edited value sane
const MAX_TIME = 6 * 60 * 60;
const MAX_INCREMENT = 600;

const isWholeNumber = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;

/** The stored terms, or null for anything else (nothing stored, corrupted, hand-edited). */
export const parseLastChallenge = (raw: string | null): LastChallenge | null => {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const { time, increment, color, rated } = value as Record<string, unknown>;
    if (!isWholeNumber(time, 1, MAX_TIME) || !isWholeNumber(increment, 0, MAX_INCREMENT)) return null;
    if (!COLORS.includes(color as PlayerColorOption) || typeof rated !== "boolean") return null;
    return { time, increment, color: color as PlayerColorOption, rated };
  } catch {
    return null;
  }
};

/**
 * The last challenge's terms, kept per account (userStore), with a
 * subscription so every place showing them follows a save.
 */
export const createLastChallengeStore = (store: UserStore) => {
  const listeners = new Set<() => void>();
  // useSyncExternalStore needs the same object back while nothing changed
  let cached: { raw: string | null; terms: LastChallenge | null } = { raw: null, terms: null };

  const read = (): LastChallenge | null => {
    const raw = store.get(KEY);
    if (raw !== cached.raw) cached = { raw, terms: parseLastChallenge(raw) };
    return cached.terms;
  };

  return {
    read,
    save({ time, increment, color, rated }: LastChallenge) {
      store.set(KEY, JSON.stringify({ time, increment, color, rated }));
      for (const listener of listeners) listener();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};

const lastChallengeStore = createLastChallengeStore(userStore("challenge", { maxEntries: 1 }));

export const readLastChallenge = lastChallengeStore.read;
/** Call when a challenge is sent from the form. */
export const saveLastChallenge = lastChallengeStore.save;

/** The terms of the last challenge you sent, or null before the first one. */
export const useLastChallenge = (): LastChallenge | null =>
  useSyncExternalStore(lastChallengeStore.subscribe, lastChallengeStore.read);
