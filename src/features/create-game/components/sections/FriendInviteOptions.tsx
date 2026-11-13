import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TimeControlsSection } from "../TimeControlsSection";
import { useGameSetup } from "../../GameSetupContext";
import { UserAvatar } from "@/components/UserAvatar";
import { useChallenges } from "@/features/notifications/context/ChallengesContext";
import type { PlayerColorOption } from "@/types/game.types";
import { formatTimeControl } from "@/utils/timeControl";
import { OutgoingChallengeCard } from "../OutgoingChallengeCard";
import { SegmentedRadioGroup, type SegmentedOption } from "@/components/SegmentedRadioGroup";

const COLOR_CHOICES: SegmentedOption<PlayerColorOption>[] = [
  { value: "white", label: "White" },
  { value: "random", label: "Random" },
  { value: "black", label: "Black" },
];

export const FriendInviteOptions = () => {
  const [colorChoice, setColorChoice] = useState<PlayerColorOption>("random");
  const { selectedFriend, isSelectedFriendLoading, timeControl, goBack } =
    useGameSetup();
  const { sendChallenge, outgoingChallenge } = useChallenges();

  if (isSelectedFriendLoading) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3" role="status" aria-label="Loading">
        <Skeleton className="size-11 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    );
  }

  if (!selectedFriend) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">Couldn't load this player.</p>
        <Button size="lg" variant="outline" onClick={goBack}>
          Back to friends
        </Button>
      </div>
    );
  }

  const rating = selectedFriend[`${timeControl.format}Rating`];
  const isWaitingForThisFriend = outgoingChallenge?.challengedId === selectedFriend.id;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex min-w-0 items-center gap-3 rounded-xl bg-muted/50 p-3">
        <UserAvatar
          src={selectedFriend.avatarUrl}
          username={selectedFriend.username}
          className="size-11 shrink-0"
        />
        <div className="min-w-0 leading-tight">
          <p className="truncate font-semibold">{selectedFriend.username}</p>
          {rating != null && (
            <p className="text-xs capitalize text-muted-foreground tabular-nums">
              {timeControl.format} {rating}
            </p>
          )}
        </div>
      </div>

      {isWaitingForThisFriend ? (
        <OutgoingChallengeCard />
      ) : (
        <>
          <TimeControlsSection showCustom={false} />

          <section className="space-y-2">
            <p
              aria-hidden="true"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              I play as
            </p>
            <SegmentedRadioGroup
              label="I play as"
              value={colorChoice}
              onValueChange={setColorChoice}
              options={COLOR_CHOICES}
            />
          </section>

          <Button
            size="xl"
            className="w-full"
            onClick={() =>
              sendChallenge(
                {
                  challengedId: selectedFriend.id,
                  color: colorChoice,
                  time: timeControl.time,
                  increment: timeControl.increment,
                },
                { username: selectedFriend.username }
              )
            }
          >
            Send{" "}
            <span className="tabular-nums">
              {formatTimeControl(timeControl.time, timeControl.increment)}
            </span>{" "}
            challenge
          </Button>
          {outgoingChallenge && (
            <p className="-mt-3 text-center text-xs text-muted-foreground">
              Your open challenge to {outgoingChallenge.username} will be withdrawn.
            </p>
          )}
        </>
      )}
    </div>
  );
};
