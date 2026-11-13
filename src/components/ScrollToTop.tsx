import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Opens every new page at the top. Back/forward (POP) is left alone so the
 * browser can restore the previous position, and links can opt out with
 * `state={{ preserveScroll: true }}` (e.g. switching tabs within a page).
 */
export const ScrollToTop = () => {
  const { pathname, state } = useLocation();
  const navigationType = useNavigationType();
  const preserve = (state as { preserveScroll?: boolean } | null)?.preserveScroll;

  useLayoutEffect(() => {
    if (navigationType === "POP" || preserve) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, navigationType, preserve]);

  return null;
};
