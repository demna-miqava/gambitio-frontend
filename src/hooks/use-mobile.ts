import * as React from "react";

// Below this width (Tailwind md) the sidebar becomes a slide-out sheet opened
// from the top bar in AppLayout. From md up it's always on screen: an icon
// rail up to xl, the full sidebar from xl.
const MOBILE_BREAKPOINT = 768;
export const WIDE_BREAKPOINT = 1280;

const subscribeTo = (query: string) => (onChange: () => void) => {
  const mql = window.matchMedia(query);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
};

/**
 * Whether a media query matches. Read synchronously on the first render, so
 * layout that depends on it doesn't pop in after the first paint.
 */
export function useMediaQuery(query: string) {
  const subscribe = React.useMemo(() => subscribeTo(query), [query]);
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}

export function useIsMobile() {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
}

/** At least xl: room for the full sidebar next to the content. */
export function useIsWideScreen() {
  return useMediaQuery(`(min-width: ${WIDE_BREAKPOINT}px)`);
}
