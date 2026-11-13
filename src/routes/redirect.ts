import { ROUTES } from "@/constants/routes";

/** Query parameter carrying where to go after signing in (Clerk's name too). */
export const REDIRECT_PARAM = "redirect_url";

const ORIGIN = "https://gambitio.invalid";

/**
 * A same-origin, relative destination from `redirect_url`, or HOME. Absolute
 * URLs, protocol-relative ("//evil.com") and backslash tricks ("/\\evil.com")
 * are refused, as are the auth pages themselves (they'd loop).
 */
export const getSafeRedirect = (value: string | null | undefined): string => {
  if (!value || !value.startsWith("/") || /^\/[/\\]/.test(value)) {
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
