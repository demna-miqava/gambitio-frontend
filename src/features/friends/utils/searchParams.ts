/**
 * The URL params for a new friends search: the query (none when empty), back
 * on page 1. Both in one navigation, so neither change overwrites the other.
 */
export const paramsForSearch = (current: URLSearchParams, query: string) => {
  const next = new URLSearchParams(current);
  if (query) next.set("search", query);
  else next.delete("search");
  next.delete("page");
  return next;
};
