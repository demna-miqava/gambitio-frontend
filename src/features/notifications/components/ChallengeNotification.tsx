import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { formatTimeControl } from "@/utils/timeControl";
import { challengeToastId } from "../hooks/useManageChallenge";
import type { Challenge } from "../types/websocket-messages";
import { describeChallengeColor } from "../utils/challengeLabels";

type ChallengeNotificationProps = {
  challenge: Challenge;
  onAccept: (challengerId: number) => void;
  onDecline: (challengerId: number) => void;
};

const ChallengeNotification = ({
  challenge,
  onAccept,
  onDecline,
}: ChallengeNotificationProps) => {
  const { challengerId, username, avatarUrl, time, increment, color, rating } =
    challenge;

  return (
    <div className="relative flex w-full flex-col gap-3">
      <button
        type="button"
        onClick={() => toast.dismiss(challengeToastId(challengerId))}
        // Inside the toast's padding (it used to hang over the edge); the
        // hit area is still 32px
        className="absolute top-0 right-0 flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Hide notification"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
      <div className="flex min-w-0 items-center gap-3 pr-8">
        <UserAvatar src={avatarUrl} username={username} className="size-10 shrink-0" />
        <div className="min-w-0 leading-tight">
          <p className="text-sm">
            <span className="font-semibold">{username}</span>
            {rating != null && (
              <span className="text-muted-foreground tabular-nums"> ({rating})</span>
            )}{" "}
            challenged you
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <span className="tabular-nums">{formatTimeControl(time, increment)}</span>
            {" · "}
            {describeChallengeColor(color)}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button size="md"
          variant="outline"
          onClick={() => onDecline(challengerId)}
        >
          <X aria-hidden="true" />
          Decline
        </Button>
        <Button size="md" onClick={() => onAccept(challengerId)}>
          <Check aria-hidden="true" />
          Accept
        </Button>
      </div>
    </div>
  );
};

export default ChallengeNotification;
