import { REVIEW_STORAGE_PREFIX } from "../constants";
import type { PositionEval } from "../types";

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
  try {
    return parseStoredEvals(localStorage.getItem(REVIEW_STORAGE_PREFIX + key), positionCount);
  } catch {
    return null; // storage disabled
  }
}

export function saveStoredEvals(key: string, evals: PositionEval[]): void {
  try {
    localStorage.setItem(REVIEW_STORAGE_PREFIX + key, JSON.stringify(evals));
  } catch {
    // Storage full or disabled: the review is still cached for this session
  }
}
