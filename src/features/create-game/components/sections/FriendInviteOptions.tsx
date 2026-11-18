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
import { Custom } from "./Custom";
import { SegmentedRadioGroup, type SegmentedOption } from "@/components/SegmentedRadioGroup";
import type { BestOf } from "@/features/notifications/types/websocket-messages";
import { OpeningPicker } from "./OpeningPicker";
import {
  gameFitsMatch,
  isMirrorMatch,
  MATCH_MINUTES,
  timedMatchLabel,
} from "@/features/series/utils/seriesFormat";

type MatchFormat = "single" | "mirror" | "series" | "timed";

const FORMAT_CHOICES: SegmentedOption<MatchFormat>[] = [
  { value: "single", label: "Single" },
  { value: "mirror", label: "Mirror" },
  { value: "series", label: "Series" },
  { value: "timed", label: "Timed" },
];

type SeriesLength = "3" | "5";

const LENGTH_CHOICES: SegmentedOption<SeriesLength>[] = [
  { value: "3", label: "Best of 3" },
  { value: "5", label: "Best of 5" },
];

/** The length a timed match starts at: the usual speed-event format */
const DEFAULT_MATCH_MINUTES = 15;

/** Under the format choice: how the chosen one is played and scored */
const formatHint = (bestOf: BestOf, matchMinutes: number | null): string | null => {
  if (matchMinutes !== null) {
    return `As many games as fit in ${matchMinutes} minutes. Each next game starts by itself with the colours swapped. A win scores 2, a draw 1, and after two wins in a row points count double. Most points when the time is up wins; a game still going then is played out and counts.`;
  }
  if (isMirrorMatch(bestOf)) {
    return "Two games from the same position, one with each colour, scored as a pair: a win each is a drawn match.";
  }
  if (bestOf > 1) {
    return `Colours alternate each game and a draw is half a point. Whoever leads after ${bestOf} games wins, or sooner once the lead can't be caught.`;
  }
  return null;
};

/** What Send says the challenge is: "best-of-3 challenge", "mirror match", "15-minute timed match" */
const challengeNoun = (bestOf: BestOf, matchMinutes: number | null): string =>
  matchMinutes !== null
    ? timedMatchLabel(matchMinutes)
    : isMirrorMatch(bestOf)
      ? "mirror match"
      : bestOf > 1
        ? `best-of-${bestOf} challenge`
        : "challenge";

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
  const [format, setFormat] = useState<MatchFormat>("single");
  const [seriesLength, setSeriesLength] = useState<SeriesLength>("3");
  const [pickedMinutes, setPickedMinutes] = useState<number>(DEFAULT_MATCH_MINUTES);
  const bestOf: BestOf =
    format === "mirror" ? 2 : format === "series" ? (Number(seriesLength) as BestOf) : 1;
  const matchMinutes = format === "timed" ? pickedMinutes : null;
  // More than one game, whatever the format
  const isMatch = bestOf > 1 || matchMinutes !== null;
  const [odds, setOdds] = useState<TimeOdds>("even");
  const [rating, setRating] = useState<Rating>("rated");
  // The shorter clock the player picked; dropped when it no longer fits the time control
  const [pickedClock, setPickedClock] = useState<number | null>(null);
  // The custom time picker, shown in the form so the friend stays selected
  const [isCustomOpen, setIsCustomOpen] = useState(false);
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
  // At least one whole game has to fit in a timed match (the server checks too)
  const tooLongForMatch =
    matchMinutes !== null && !gameFitsMatch(timeControl.time, timeControl.increment, matchMinutes);

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
                    {isMatch ? ", in every game" : ""}. Games with time odds are unrated.
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
                  {bestOf > 1
                    ? "No game of the series changes"
                    : matchMinutes !== null
                      ? "No game of the match changes"
                      : "The game doesn't change"}{" "}
                  either
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
            {format === "series" && (
              <SegmentedRadioGroup
                label="Series length"
                value={seriesLength}
                onValueChange={setSeriesLength}
                options={LENGTH_CHOICES}
              />
            )}
            {matchMinutes !== null && (
              <div className="flex items-center justify-between gap-3 pt-1">
                <Label htmlFor="match-minutes" className="min-w-0 truncate">
                  Match length
                </Label>
                <Select value={String(matchMinutes)} onValueChange={(v) => setPickedMinutes(Number(v))}>
                  <SelectTrigger id="match-minutes" className="h-11 w-32 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATCH_MINUTES.map((minutes) => (
                      <SelectItem key={minutes} value={String(minutes)}>
                        {minutes} min
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {formatHint(bestOf, matchMinutes) && (
              <p className="text-xs text-muted-foreground">{formatHint(bestOf, matchMinutes)}</p>
            )}
            {tooLongForMatch && (
              <p role="alert" className="text-xs font-medium text-destructive">
                A {formatTimeControl(timeControl.time, timeControl.increment)} game doesn't fit in{" "}
                {matchMinutes} minutes. Pick a faster time control or a longer match.
              </p>
            )}
          </section>

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

          <Button
            size="xl"
            className="h-auto min-h-12 w-full whitespace-normal py-2.5"
            disabled={tooLongForMatch}
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
                  ...(startingOpening && { openingId: startingOpening.id }),
                  ...(matchMinutes !== null && { matchMinutes }),
                },
                { username: selectedFriend.username, opening: startingOpening }
              )
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
                Send {isUnrated && "unrated "}
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
