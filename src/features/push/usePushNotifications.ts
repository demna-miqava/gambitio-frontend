import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  PushPermissionDeniedError,
  PushUnavailableError,
  currentSubscription,
  disablePush,
  enablePush,
  pushBlocker,
  type PushBlocker,
} from "./pushClient";

export type PushStatus =
  /** Still finding out */
  | "loading"
  | "on"
  | "off"
  /** The user (or their browser) said no to notifications from this site */
  | "blocked"
  | PushBlocker;

/** Push notifications in this browser: whether they're on, and turning them on and off. */
export const usePushNotifications = () => {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [isChanging, setIsChanging] = useState(false);

  const refresh = useCallback(async () => {
    const blocker = pushBlocker();
    if (blocker) return setStatus(blocker);
    if (Notification.permission === "denied") return setStatus("blocked");
    const subscription = await currentSubscription().catch(() => null);
    setStatus(subscription && Notification.permission === "granted" ? "on" : "off");
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setEnabled = useCallback(
    async (enabled: boolean) => {
      setIsChanging(true);
      try {
        await (enabled ? enablePush() : disablePush());
      } catch (error) {
        if (error instanceof PushPermissionDeniedError) {
          // The status below explains it
        } else if (error instanceof PushUnavailableError) {
          toast.error(error.message);
        } else {
          toast.error(enabled ? "Couldn't turn notifications on" : "Couldn't turn notifications off", {
            description: "Check your connection and try again.",
          });
        }
      } finally {
        await refresh();
        setIsChanging(false);
      }
    },
    [refresh]
  );

  return { status, isChanging, setEnabled };
};
