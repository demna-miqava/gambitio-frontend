import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isGameRoute } from "@/config/shell";
import { useUser } from "@/hooks/useUser";
import { syncPushSubscription } from "./pushClient";

type NotificationClick = { type: "gambitio:notification-click"; url: string; tag: string };

const isNotificationClick = (data: unknown): data is NotificationClick =>
  typeof data === "object" &&
  data !== null &&
  (data as { type?: unknown }).type === "gambitio:notification-click" &&
  typeof (data as { url?: unknown }).url === "string";

/**
 * Keeps push notifications tied to the signed-in account, and follows a
 * clicked notification to its page when the app is already open. Renders
 * nothing.
 */
export const PushSync = () => {
  const { id } = useUser();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // This browser's subscription belongs to whoever is signed in on it now
  useEffect(() => {
    if (id === undefined) return;
    syncPushSubscription().catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      if (!isNotificationClick(event.data)) return;
      const { url, tag } = event.data;
      // A path of ours only (the service worker checks too)
      if (!/^\/(?!\/)/.test(url) || url === pathname) return;
      // A challenge is already on screen as a toast, wherever the user is
      if (tag.startsWith("challenge-")) return;
      // Never pull a player out of a game, except into the game the notification is about
      if (isGameRoute(pathname) && !isGameRoute(url)) return;
      navigate(url);
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [navigate, pathname]);

  return null;
};
