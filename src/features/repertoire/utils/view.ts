import type { PlayerColor } from "@/features/game/types/game.types";

/** The page's sections, kept in the URL so links and Back work. */
export type RepertoireView = "lines" | "practice" | "games";

export const REPERTOIRE_VIEWS: { value: RepertoireView; label: string }[] = [
  { value: "lines", label: "Lines" },
  { value: "practice", label: "Practice" },
  { value: "games", label: "Your games" },
];

export const parseView = (value: string | null): RepertoireView =>
  value === "practice" || value === "games" ? value : "lines";

export const parseColor = (value: string | null): PlayerColor => (value === "black" ? "black" : "white");

/** Search params for a view (and, in practice, a line to start with). */
export const viewSearch = (view: RepertoireView, extra: { line?: number; color?: PlayerColor } = {}) => {
  const params = new URLSearchParams();
  if (view !== "lines") params.set("view", view);
  if (extra.color && view === "lines") params.set("color", extra.color);
  if (extra.line !== undefined) params.set("line", String(extra.line));
  const query = params.toString();
  return query ? `?${query}` : "";
};
