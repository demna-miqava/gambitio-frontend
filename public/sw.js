/*
 * Gambitio's service worker. It only handles push notifications: it has no
 * fetch handler, so it never caches or changes what the app loads.
 *
 * The app registers it when someone turns notifications on (see
 * src/features/push/pushClient.ts). The server sends
 * { title, body, url, tag } (see PushPayload in the backend).
 */

self.addEventListener("install", () => {
  // Nothing to wait for: a new version replaces the old one at once
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/** A path inside the app. Anything else (another site, a scheme) becomes the home page. */
function appPath(value) {
  return typeof value === "string" && /^\/(?!\/)/.test(value) ? value : "/home";
}

// Safari takes notification permission away from a site whose pushes show
// nothing, so there every push is shown. Chrome and Firefox allow staying
// silent while the site is on screen.
const mustAlwaysShow = /Safari/.test(navigator.userAgent) && !/Chrome|Chromium|Android/.test(navigator.userAgent);

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // Not ours, or damaged: fall through to the generic notification
  }
  const title = typeof data.title === "string" && data.title ? data.title.slice(0, 80) : "Gambitio";
  // A later notification with the same tag replaces the earlier one (and
  // alerts again); "renotify" is only allowed together with a tag
  const tag = typeof data.tag === "string" && data.tag ? data.tag.slice(0, 64) : undefined;
  const options = {
    body: typeof data.body === "string" ? data.body.slice(0, 200) : "",
    ...(tag && { tag, renotify: true }),
    icon: "/logo-mark.png",
    badge: "/favicon.png",
    data: { url: appPath(data.url), tag: tag || "" },
  };

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // Someone looking at the app already sees it there (a toast, a badge)
      if (!mustAlwaysShow && windows.some((client) => client.focused)) return;
      await self.registration.showNotification(title, options);
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { url, tag } = event.notification.data || {};
  const path = appPath(url);

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const open = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (open) {
        // The app decides whether to go there (it won't pull a player out of a game)
        await open.focus();
        open.postMessage({ type: "gambitio:notification-click", url: path, tag: tag || "" });
        return;
      }
      await self.clients.openWindow(path);
    })()
  );
});
