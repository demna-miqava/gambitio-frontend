const RELOAD_KEY = "gambitio:preload-reload-at";
const RELOAD_COOLDOWN_MS = 10_000;

/**
 * After a deploy, an open tab still points at the old hashed chunks, which no
 * longer exist. Reload once to pick up the new build; if that already
 * happened moments ago, let the error reach the error boundary instead of
 * reloading forever. Also when offline (a reload would only replace the app
 * with the browser's offline page) or when the last reload can't be recorded
 * (storage blocked: nothing would stop a loop).
 */
export function reloadOnStaleChunks() {
  window.addEventListener("vite:preloadError", (event) => {
    if (!navigator.onLine) return;
    try {
      const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
      if (Date.now() - last < RELOAD_COOLDOWN_MS) return;
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    } catch {
      return;
    }
    event.preventDefault();
    window.location.reload();
  });
}
