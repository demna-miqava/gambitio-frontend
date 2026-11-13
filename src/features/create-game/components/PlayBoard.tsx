import { useUser } from "@/hooks/useUser";
import { Chessground } from "@lichess-org/chessground";
import { useEffect, useRef } from "react";
import { Loader2, UserRound } from "lucide-react";
import { BoardLayout } from "@/features/game/components/BoardLayout";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { useGameSetup } from "../GameSetupContext";
import { ClockFace } from "@/features/game/components/ClockFace";
import { formatTime } from "@/features/game/utils/time-formatter";
import type { TimeControl } from "../hooks/useTimeControl";

type Ratings = { blitzRating?: number; bulletRating?: number; rapidRating?: number };

const ratingFor = (ratings: Ratings, format: TimeControl["format"]) => {
  switch (format) {
    case "bullet":
      return ratings.bulletRating;
    case "blitz":
      return ratings.blitzRating;
    case "rapid":
      return ratings.rapidRating;
    default:
      return undefined;
  }
};

/** Stand-in avatar for the opponent before there is one */
const OpponentSlot = ({ searching }: { searching: boolean }) => (
  <span
    aria-hidden="true"
    className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground"
  >
    {searching ? (
      <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
    ) : (
      <UserRound className="size-4" />
    )}
  </span>
);

export const PlayBoard = () => {
  const user = useUser();
  const { username, image } = user;
  const { timeControl, selectedFriend, isSearching, activeSection } = useGameSetup();
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!boardRef.current) return;
    const cg = Chessground(boardRef.current, {
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",
      viewOnly: true,
      coordinates: true,
    });
    return () => cg.destroy();
  }, []);

  // The challenged friend once one is picked; otherwise a neutral slot
  const friend = activeSection === "friend-invite-options" ? selectedFriend : null;
  const topPlayer = friend
    ? {
        name: friend.username,
        startingRating: ratingFor(friend, timeControl.format),
        avatar: (
          <PlayerAvatar username={friend.username} avatarUrl={friend.avatarUrl} size="sm" />
        ),
      }
    : {
        name: isSearching ? "Finding an opponent…" : "Your opponent",
        avatar: <OpponentSlot searching={isSearching} />,
      };

  const startingTime = formatTime(timeControl.time * 1000);

  return (
    <BoardLayout
      boardRef={boardRef}
      topPlayer={topPlayer}
      bottomPlayer={{
        name: username,
        startingRating: ratingFor(user, timeControl.format),
        avatar: <PlayerAvatar username={username} avatarUrl={image} size="sm" />,
      }}
      topPlayerClock={<ClockFace>{startingTime}</ClockFace>}
      bottomPlayerClock={<ClockFace>{startingTime}</ClockFace>}
    />
  );
};
