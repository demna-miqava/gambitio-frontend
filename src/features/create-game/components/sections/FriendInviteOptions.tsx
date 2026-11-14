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
import type { BestOf } from "@/features/notifications/types/websocket-messages";

type MatchFormat = "1" | "3" | "5";

const FORMAT_CHOICES: SegmentedOption<MatchFormat>[] = [
  { value: "1", label: "Single game" },
  { value: "3", label: "Best of 3" },
  { value: "5", label: "Best of 5" },
];

const COLOR_CHOICES: SegmentedOption<PlayerColorOption>[] = [
  { value: "white", label: "White" },
  { value: "random", label: "Random" },
  { value: "black", label: "Black" },
];

export const FriendInviteOptions = () => {
  const [colorChoice, setColorChoice] = useState<PlayerColorOption>("random");
  const [format, setFormat] = useState<MatchFormat>("1");
  const bestOf = Number(format) as BestOf;
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
      <div className="flex flex-col items-center gap-3 rounded-xl bg-card px-4 py-8 text-center">
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
          <p className="truncate font-medium">{selectedFriend.username}</p>
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
              className="text-sm text-muted-foreground"
            >
              Match format
            </p>
            <SegmentedRadioGroup
              label="Match format"
              value={format}
              onValueChange={setFormat}
              options={FORMAT_CHOICES}
            />
            {bestOf > 1 && (
              <p className="text-xs text-muted-foreground">
                Colours alternate each game and a draw is half a point. Whoever leads after{" "}
                {bestOf} games wins, or sooner once the lead can't be caught.
              </p>
            )}
          </section>

          <section className="space-y-2">
            <p
              aria-hidden="true"
              className="text-sm text-muted-foreground"
            >
              {bestOf > 1 ? "I play first as" : "I play as"}
            </p>
            <SegmentedRadioGroup
              label={bestOf > 1 ? "I play the first game as" : "I play as"}
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
                  bestOf,
                },
                { username: selectedFriend.username }
              )
            }
          >
            Send{" "}
            <span className="tabular-nums">
              {formatTimeControl(timeControl.time, timeControl.increment)}
            </span>{" "}
            {bestOf > 1 ? `best-of-${bestOf} challenge` : "challenge"}
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
