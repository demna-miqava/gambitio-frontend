import { userStore } from "@/utils/userStorage";
import { REVIEW_STORAGE_PREFIX } from "../constants";
import type { PositionEval } from "../types";

/**
 * Saved reviews, per signed-in account (cleared on sign-out) and capped to
 * the most recent ones. They used to live under REVIEW_STORAGE_PREFIX for
 * everyone alike; those are dropped (a review is cheap to run again).
 */
const reviews = userStore("review:v1", { legacyPrefix: REVIEW_STORAGE_PREFIX });

function isPositionEval(value: unknown): value is PositionEval {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.type === "over") return v.result === 1 || v.result === 0 || v.result === -1;
  if (v.type !== "cp" && v.type !== "mate") return false;
  return (
    typeof v.value === "number" &&
    Number.isFinite(v.value) &&
    (v.bestMove === undefined || typeof v.bestMove === "string")
  );
}

/** Parses saved evaluations; null if missing, corrupt, or for a different number of positions. */
export function parseStoredEvals(raw: string | null, positionCount: number): PositionEval[] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== positionCount) return null;
    return parsed.every(isPositionEval) ? parsed : null;
  } catch {
    return null;
  }
}

export function loadStoredEvals(key: string, positionCount: number): PositionEval[] | null {
  // Storage disabled reads as nothing saved
  return parseStoredEvals(reviews.get(key), positionCount);
}

export function saveStoredEvals(key: string, evals: PositionEval[]): void {
  // Storage full or disabled: the review is still cached for this session
  reviews.set(key, JSON.stringify(evals));
}
