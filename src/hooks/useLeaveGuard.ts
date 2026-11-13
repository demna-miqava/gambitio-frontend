import { useEffect } from "react";
import { useBlocker } from "react-router-dom";

/**
 * While `when` is true, asks before the user leaves the page: in-app
 * navigation (links, back button, edge-swipe back) is held by a router
 * blocker, and closing or reloading the tab gets the browser's own prompt.
 *
 * Render a confirmation for `blocker.state === "blocked"` and call
 * `blocker.proceed()` / `blocker.reset()` from it (see LeaveGameDialog).
 */
export function useLeaveGuard(when: boolean) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (!when) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Older browsers need returnValue set to show the prompt
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [when]);

  // If the guard turns off while a navigation is held (e.g. the opponent
  // resigned while the dialog was open), stay so the user sees the result,
  // rather than leaving without them having chosen to.
  useEffect(() => {
    if (!when && blocker.state === "blocked") blocker.reset();
  }, [when, blocker]);

  return blocker;
}
