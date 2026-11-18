import { ROUTES } from "@/constants/routes";

/** Query parameter carrying where to go after signing in (Clerk's name too). */
export const REDIRECT_PARAM = "redirect_url";

const ORIGIN = "https://gambitio.invalid";

// Browsers read "\" as "/" and drop tabs and newlines, so "/\evil.com" or
// "/\t/evil.com" would leave the site
// eslint-disable-next-line no-control-regex
const UNSAFE_CHARS = /[\\\u0000-\u001f\u007f]/;

/**
 * A same-origin, relative destination from `redirect_url` (or a clicked
 * notification), or HOME. Absolute URLs, protocol-relative ("//evil.com"),
 * backslashes ("/\\evil.com") and control characters are refused, as are the
 * auth pages themselves (they'd loop). public/sw.js applies the same rules
 * (but for the auth pages) to notification links: keep them in step.
 */
export const getSafeRedirect = (value: string | null | undefined): string => {
  if (!value || !value.startsWith("/") || value.startsWith("//") || UNSAFE_CHARS.test(value)) {
    return ROUTES.HOME;
  }
  try {
    const url = new URL(value, ORIGIN);
    if (url.origin !== ORIGIN) return ROUTES.HOME;
    const authPages: string[] = [
      ROUTES.LANDING,
      ROUTES.AUTH.SIGN_IN,
      ROUTES.AUTH.SIGN_UP,
      ROUTES.AUTH.PROFILE_SETUP,
    ];
    if (authPages.includes(url.pathname)) return ROUTES.HOME;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return ROUTES.HOME;
  }
};

/** An auth page URL that brings the user back to `destination` afterwards. */
export const withRedirect = (authPath: string, destination: string) => {
  const safe = getSafeRedirect(destination);
  return safe === ROUTES.HOME
    ? authPath
    : `${authPath}?${REDIRECT_PARAM}=${encodeURIComponent(safe)}`;
};
