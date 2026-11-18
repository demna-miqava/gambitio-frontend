import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TimeControlsSection } from "../TimeControlsSection";
import { useGameSetup } from "../../GameSetupContext";
import { UserAvatar } from "@/components/UserAvatar";
import { useChallenges } from "@/features/notifications/context/ChallengesContext";
import type { PlayerColorOption } from "@/types/game.types";
import { formatTimeControl, formatTimeOdds } from "@/utils/timeControl";
import { OutgoingChallengeCard } from "../OutgoingChallengeCard";
import { Custom } from "./Custom";
import { SegmentedRadioGroup, type SegmentedOption } from "@/components/SegmentedRadioGroup";
import type { BestOf } from "@/features/notifications/types/websocket-messages";
import { OpeningPicker } from "./OpeningPicker";
import { isMirrorMatch, timedMatchLabel } from "@/features/series/utils/seriesFormat";
import {
  extraOptionsSummary,
  planChallenge,
  type MatchFormat,
  type Rating,
  type SeriesLength,
  type TimeOdds,
} from "../../utils/challengePlan";
import { TimeOddsSection } from "./friend-invite/TimeOddsSection";
import { MatchFormatSection } from "./friend-invite/MatchFormatSection";
import { RatingSection } from "./friend-invite/RatingSection";
import { MoreOptionsSection } from "./friend-invite/MoreOptionsSection";

/** The length a timed match starts at: the usual speed-event format */
const DEFAULT_MATCH_MINUTES = 15;

/** What Send says the challenge is: "best-of-3 challenge", "mirror match", "15-minute timed match" */
const challengeNoun = (bestOf: BestOf, matchMinutes: number | null): string =>
  matchMinutes !== null
    ? timedMatchLabel(matchMinutes)
    : isMirrorMatch(bestOf)
      ? "mirror match"
      : bestOf > 1
        ? `best-of-${bestOf} challenge`
        : "challenge";

const COLOR_CHOICES: SegmentedOption<PlayerColorOption>[] = [
  { value: "white", label: "White" },
  { value: "random", label: "Random" },
  { value: "black", label: "Black" },
];

export const FriendInviteOptions = () => {
  const [colorChoice, setColorChoice] = useState<PlayerColorOption>("random");
  const [format, setFormat] = useState<MatchFormat>("single");
  const [seriesLength, setSeriesLength] = useState<SeriesLength>("3");
  const [pickedMinutes, setPickedMinutes] = useState<number>(DEFAULT_MATCH_MINUTES);
  const [odds, setOdds] = useState<TimeOdds>("even");
  const [rating, setRating] = useState<Rating>("rated");
  // The shorter clock the player picked; dropped when it no longer fits the time control
  const [pickedClock, setPickedClock] = useState<number | null>(null);
  // The custom time picker, shown in the form so the friend stays selected
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  // Time odds, the match format and the starting position, folded away until asked for
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const {
    selectedFriend,
    isSelectedFriendLoading,
    timeControl,
    goBack,
    startingOpening,
    setStartingOpening,
  } = useGameSetup();
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
  // The rules (bestOf, odds clocks, when it's unrated) live in planChallenge
  const plan = planChallenge({
    friendId: selectedFriend.id,
    color: colorChoice,
    time: timeControl.time,
    increment: timeControl.increment,
    format,
    seriesLength,
    matchMinutes: pickedMinutes,
    odds,
    pickedClock,
    rating,
    openingId: startingOpening?.id ?? null,
  });
  const { bestOf, matchMinutes, isMatch, hasOdds, ownTime, friendTime } = plan;
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
          <div className="space-y-3">
            <TimeControlsSection
              onCustom={() => setIsCustomOpen((open) => !open)}
              isCustomOpen={isCustomOpen}
            />
            {isCustomOpen && (
              <div className="rounded-xl bg-muted/50 p-4">
                <Custom onDone={() => setIsCustomOpen(false)} />
              </div>
            )}
          </div>

          <RatingSection plan={plan} rating={rating} onRatingChange={setRating} />

          <section className="space-y-2">
            <p
              aria-hidden="true"
              className="text-sm text-muted-foreground"
            >
              {isMatch ? "I play first as" : "I play as"}
            </p>
            <SegmentedRadioGroup
              label={isMatch ? "I play the first game as" : "I play as"}
              value={colorChoice}
              onValueChange={setColorChoice}
              options={COLOR_CHOICES}
            />
          </section>

          {/*
            Last, as the options most challenges leave alone. Kept open while
            the timed match doesn't fit, since that is what disables Send and
            the reason is shown inside
          */}
          <MoreOptionsSection
            open={isMoreOpen || !plan.fitsMatch}
            onOpenChange={setIsMoreOpen}
            summary={extraOptionsSummary(plan, startingOpening?.name ?? null)}
          >
            <TimeOddsSection
              plan={plan}
              odds={odds}
              onOddsChange={setOdds}
              onClockChange={setPickedClock}
              friendName={selectedFriend.username}
            />

            <MatchFormatSection
              plan={plan}
              format={format}
              onFormatChange={setFormat}
              seriesLength={seriesLength}
              onSeriesLengthChange={setSeriesLength}
              onMatchMinutesChange={setPickedMinutes}
              time={timeControl.time}
              increment={timeControl.increment}
            />

            <OpeningPicker
              value={startingOpening?.id ?? null}
              onChange={setStartingOpening}
              hint={
                isMirrorMatch(bestOf) && !startingOpening
                  ? "Pick an opening to play it from both sides."
                  : startingOpening && isMatch
                    ? "Every game starts from this position."
                    : undefined
              }
            />
          </MoreOptionsSection>

          <Button
            size="xl"
            className="h-auto min-h-12 w-full whitespace-normal py-2.5"
            disabled={!plan.fitsMatch}
            onClick={() =>
              sendChallenge(plan.data, { username: selectedFriend.username, opening: startingOpening })
            }
          >
            {/*
              Two parts that never break inside, so a long label (time odds
              and a series) wraps between them on a narrow screen. Each is
              one element: the button is a flex row with a gap, which would
              space loose text nodes apart
            */}
            <span className="flex flex-wrap justify-center gap-x-1.5">
              <span className="whitespace-nowrap">
                {/* With time odds the clocks already say it's unrated */}
                Send {!plan.rated && !hasOdds && "unrated "}
                {challengeNoun(bestOf, matchMinutes)}
              </span>
              <span className="whitespace-nowrap tabular-nums opacity-80">
                (
                {hasOdds
                  ? formatTimeOdds(ownTime, friendTime)
                  : formatTimeControl(timeControl.time, timeControl.increment)}
                )
              </span>
            </span>
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
