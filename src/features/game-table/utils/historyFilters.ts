/**
 * Game history filters, kept in the URL query string so a filtered view can
 * be linked, survives a reload and Back undoes the last change. Values
 * nobody could have put there through the page (hand-edited URLs) are
 * ignored rather than sent.
 */

export const RESULT_FILTERS = ["won", "lost", "drawn"] as const;
export const TIME_CONTROL_FILTERS = ["bullet", "blitz", "rapid"] as const;
export const COLOR_FILTERS = ["white", "black"] as const;
export const RATED_FILTERS = ["rated", "unrated"] as const;
export const KIND_FILTERS = ["online", "tournament", "bot", "table"] as const;

export interface HistoryFilters {
  result?: (typeof RESULT_FILTERS)[number];
  timeControl?: (typeof TIME_CONTROL_FILTERS)[number];
  color?: (typeof COLOR_FILTERS)[number];
  rated?: (typeof RATED_FILTERS)[number];
  kind?: (typeof KIND_FILTERS)[number];
  /** A username, as typed */
  opponent?: string;
  /** Local calendar days, YYYY-MM-DD, both included */
  from?: string;
  to?: string;
}

export type HistoryFilterKey = keyof HistoryFilters;

/** The query parameters that hold filters (page is not one of them) */
export const FILTER_KEYS: HistoryFilterKey[] = [
  "result",
  "timeControl",
  "color",
  "rated",
  "kind",
  "opponent",
  "from",
  "to",
];

const USERNAME = /^[a-zA-Z0-9_]{1,30}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

const oneOf = <T extends string>(values: readonly T[], value: string | null): T | undefined =>
  value !== null && (values as readonly string[]).includes(value) ? (value as T) : undefined;

const validDay = (value: string | null) =>
  value !== null && DAY.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime())
    ? value
    : undefined;

export const parseHistoryFilters = (params: URLSearchParams): HistoryFilters => {
  const opponent = params.get("opponent")?.trim();
  const filters: HistoryFilters = {
    result: oneOf(RESULT_FILTERS, params.get("result")),
    timeControl: oneOf(TIME_CONTROL_FILTERS, params.get("timeControl")),
    color: oneOf(COLOR_FILTERS, params.get("color")),
    rated: oneOf(RATED_FILTERS, params.get("rated")),
    kind: oneOf(KIND_FILTERS, params.get("kind")),
    opponent: opponent && USERNAME.test(opponent) ? opponent : undefined,
    from: validDay(params.get("from")),
    to: validDay(params.get("to")),
  };
  // Only what is set, so filters compare and key queries by value
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined)
  ) as HistoryFilters;
};

/** The date range runs backwards (the page says so, and sends neither end) */
export const isDateRangeInverted = (f: HistoryFilters) => !!f.from && !!f.to && f.from > f.to;

/** How many filters are on; a date range counts once */
export const countActiveFilters = (f: HistoryFilters) => {
  const { from, to, ...rest } = f;
  return Object.values(rest).filter(Boolean).length + (from || to ? 1 : 0);
};

const startOfLocalDay = (day: string) => new Date(`${day}T00:00:00`);

/**
 * The filters as GET /users/:id/games takes them. Days become instants at
 * the start of the local day (the end day up to the start of the next), so
 * "to 21 November" includes all of that day where the player is.
 */
export const historyFiltersToApi = (f: HistoryFilters): Record<string, string> => {
  const api: Record<string, string> = {};
  if (f.result) api.result = f.result;
  if (f.timeControl) api.timeControl = f.timeControl;
  if (f.color) api.color = f.color;
  if (f.rated) api.rated = f.rated === "rated" ? "true" : "false";
  if (f.kind) api.kind = f.kind;
  if (f.opponent) api.opponent = f.opponent;
  if (!isDateRangeInverted(f)) {
    if (f.from) api.since = startOfLocalDay(f.from).toISOString();
    if (f.to) {
      const next = startOfLocalDay(f.to);
      next.setDate(next.getDate() + 1);
      api.before = next.toISOString();
    }
  }
  return api;
};

/**
 * The query string after changing one filter (undefined or "" removes it):
 * back to page 1, other parameters kept.
 */
export const withFilter = (
  params: URLSearchParams,
  key: HistoryFilterKey,
  value: string | undefined
): URLSearchParams => {
  const next = new URLSearchParams(params);
  if (value === undefined || value === "") next.delete(key);
  else next.set(key, value);
  next.delete("page");
  return next;
};

/** The query string with every filter removed, back to page 1 */
export const withoutFilters = (params: URLSearchParams): URLSearchParams => {
  const next = new URLSearchParams(params);
  for (const key of FILTER_KEYS) next.delete(key);
  next.delete("page");
  return next;
};
