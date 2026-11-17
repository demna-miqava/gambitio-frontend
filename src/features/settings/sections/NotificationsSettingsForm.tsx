import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePushNotifications, type PushStatus } from "@/features/push/usePushNotifications";

/** Why the switch can't be used, for the statuses where it can't */
const UNAVAILABLE: Partial<Record<PushStatus, string>> = {
  blocked:
    "Notifications are blocked for this site. Allow them in your browser's site settings, then come back here.",
  unsupported: "This browser doesn't support push notifications.",
  "needs-install":
    "On iPhone and iPad, add Gambitio to your Home Screen first (Share, then Add to Home Screen) and open it from there.",
};

/**
 * Push notifications are a choice per browser, not per account, so this
 * isn't one of the saved settings: the switch shows what this browser is
 * doing. (Email notifications aren't offered: the server doesn't send any.)
 */
export const NotificationsSettingsForm = () => {
  const { status, isChanging, setEnabled } = usePushNotifications();
  const unavailable = UNAVAILABLE[status];
  const id = "setting-push-notifications";
  const descriptionId = `${id}-description`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-6">
        <div className="space-y-0.5">
          <Label htmlFor={id}>Push notifications on this device</Label>
          <p id={descriptionId} className="text-sm text-muted-foreground">
            Challenges, friend requests and the start of your game, when Gambitio is in the
            background or closed
          </p>
        </div>
        <Switch
          id={id}
          aria-describedby={descriptionId}
          checked={status === "on"}
          disabled={status === "loading" || isChanging || Boolean(unavailable)}
          onCheckedChange={(checked) => void setEnabled(checked)}
        />
      </div>
      {unavailable && (
        <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground" role="status">
          {unavailable}
        </p>
      )}
    </div>
  );
};
