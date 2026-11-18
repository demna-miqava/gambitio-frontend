/**
 * A database id from a route param, query param or other user-supplied text:
 * a positive safe integer in plain digits ("12"), or null.
 *
 * Use it before putting such text in an API or socket path. React Router
 * decodes params, so "/game/..%2Fusers%2F5" gives gameId "../users/5", which
 * `/games/${gameId}` would turn into a request for /api/users/5. Number()
 * alone is too lenient ("1e3", "0x10", " 7 ", "1.0" all parse).
 */
export const parsePositiveId = (raw: string | null | undefined): number | null => {
  if (typeof raw !== "string" || !/^[1-9]\d*$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
};
