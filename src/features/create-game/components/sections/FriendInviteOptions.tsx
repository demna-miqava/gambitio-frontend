import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TimeControlsSection } from "../TimeControlsSection";
import { useGameSetup } from "../../GameSetupContext";
import { UserAvatar } from "@/components/UserAvatar";
import { useChallenges } from "@/features/notifications/context/ChallengesContext";
import type { PlayerColorOption } from "@/types/game.types";
import { formatClock, formatTimeControl, formatTimeOdds } from "@/utils/timeControl";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { defaultShorterClock, shorterClocks } from "../../constants/timeControls";
import { OutgoingChallengeCard } from "../OutgoingChallengeCard";
import { SegmentedRadioGroup, type SegmentedOption } from "@/components/SegmentedRadioGroup";
import type { BestOf } from "@/features/notifications/types/websocket-messages";

type MatchFormat = "1" | "3" | "5";

const FORMAT_CHOICES: SegmentedOption<MatchFormat>[] = [
  { value: "1", label: "Single game" },
  { value: "3", label: "Best of 3" },
  { value: "5", label: "Best of 5" },
];

/** Who starts with less time: nobody, the sender, or the friend */
type TimeOdds = "even" | "me" | "them";

const ODDS_CHOICES: SegmentedOption<TimeOdds>[] = [
  { value: "even", label: "Even" },
  { value: "me", label: "Less for me" },
  { value: "them", label: "Less for them" },
];

/** Whether the game (or every game of the series) changes ratings */
type Rating = "rated" | "unrated";

const RATING_CHOICES: SegmentedOption<Rating>[] = [
  { value: "rated", label: "Rated" },
  { value: "unrated", label: "Unrated" },
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
  const [odds, setOdds] = useState<TimeOdds>("even");
  const [rating, setRating] = useState<Rating>("rated");
  // The shorter clock the player picked; dropped when it no longer fits the time control
  const [pickedClock, setPickedClock] = useState<number | null>(null);
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

  const friendRating = selectedFriend[`${timeControl.format}Rating`];
  // Time odds: one player keeps the time control's clock, the other gets a
  // shorter one. No shorter clock exists below the shortest time control
  const clockChoices = shorterClocks(timeControl.time);
  const shorterClock =
    pickedClock !== null && clockChoices.includes(pickedClock)
      ? pickedClock
      : defaultShorterClock(timeControl.time);
  const hasOdds = odds !== "even" && shorterClock !== null;
  const ownTime = hasOdds && odds === "me" ? shorterClock : timeControl.time;
  const friendTime = hasOdds && odds === "them" ? shorterClock : timeControl.time;
  // Time odds always make it unrated, so the choice only applies to even clocks
  const isUnrated = !hasOdds && rating === "unrated";
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
          {friendRating != null && (
            <p className="text-xs capitalize text-muted-foreground tabular-nums">
              {timeControl.format} {friendRating}
            </p>
          )}
        </div>
      </div>

      {isWaitingForThisFriend ? (
        <OutgoingChallengeCard />
      ) : (
        <>
          <TimeControlsSection showCustom={false} />

          {clockChoices.length > 0 && (
            <section className="space-y-3">
              <div className="space-y-2">
                <p aria-hidden="true" className="text-sm text-muted-foreground">
                  Time odds
                </p>
                <SegmentedRadioGroup
                  label="Time odds"
                  value={odds}
                  onValueChange={setOdds}
                  options={ODDS_CHOICES}
                />
              </div>
              {hasOdds && (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="odds-clock" className="min-w-0 truncate">
                      {odds === "me" ? "My clock" : `${selectedFriend.username}'s clock`}
                    </Label>
                    <Select
                      value={String(shorterClock)}
                      onValueChange={(v) => setPickedClock(Number(v))}
                    >
                      <SelectTrigger id="odds-clock" className="h-11 w-32 shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {clockChoices.map((clock) => (
                          <SelectItem key={clock} value={String(clock)}>
                            {formatClock(clock)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You start with {formatClock(ownTime)}, {selectedFriend.username} with{" "}
                    {formatClock(friendTime)}
                    {bestOf > 1 ? ", in every game" : ""}. Games with time odds are unrated.
                  </p>
                </>
              )}
            </section>
          )}

          {!hasOdds && (
            <section className="space-y-2">
              <p aria-hidden="true" className="text-sm text-muted-foreground">
                Rating
              </p>
              <SegmentedRadioGroup
                label="Rating"
                value={rating}
                onValueChange={setRating}
                options={RATING_CHOICES}
              />
              {isUnrated && (
                <p className="text-xs text-muted-foreground">
                  {bestOf > 1 ? "No game of the series changes" : "The game doesn't change"} either
                  player's rating.
                </p>
              )}
            </section>
          )}

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
                  time: ownTime,
                  increment: timeControl.increment,
                  ...(hasOdds && { opponentTime: friendTime }),
                  bestOf,
                  ...(isUnrated && { rated: false }),
                },
                { username: selectedFriend.username }
              )
            }
          >
            Send{" "}
            <span className="tabular-nums">
              {hasOdds
                ? formatTimeOdds(ownTime, friendTime)
                : formatTimeControl(timeControl.time, timeControl.increment)}
            </span>{" "}
            {isUnrated && "unrated "}
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
