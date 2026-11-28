import { useUser } from "@/hooks/useUser";
import { Chessground } from "@lichess-org/chessground";
import type { Api } from "@lichess-org/chessground/api";
import { useEffect, useRef } from "react";
import { Loader2, UserRound } from "lucide-react";
import { BoardLayout } from "@/features/game/components/BoardLayout";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { useGameSetup } from "../GameSetupContext";
import { ClockFace } from "@/features/game/components/ClockFace";
import { formatTime } from "@/features/game/utils/time-formatter";
import type { TimeControl } from "../hooks/useTimeControl";
import { BotAvatar } from "@/features/play-bots/components/BotAvatar";

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

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";

export const PlayBoard = () => {
  const user = useUser();
  const { username, image } = user;
  const { timeControl, selectedFriend, isSearching, activeSection, startingOpening, bot, botColor } =
    useGameSetup();
  // The "A bot" tab: the bot across the board, from the side picked, no clocks
  const againstBot = activeSection === "bot";
  const orientation = againstBot && botColor === "black" ? "black" : "white";
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);

  useEffect(() => {
    if (!boardRef.current) return;
    const cg = Chessground(boardRef.current, {
      fen: START_FEN,
      viewOnly: true,
      coordinates: true,
    });
    cgRef.current = cg;
    return () => {
      cg.destroy();
      cgRef.current = null;
    };
  }, []);

  // The challenged friend once one is picked; otherwise a neutral slot
  const friend = activeSection === "friend-invite-options" ? selectedFriend : null;
  // The challenge form's opening, while it's open
  const fen = (friend && startingOpening?.fen) || START_FEN;
  useEffect(() => {
    cgRef.current?.set({ fen });
  }, [fen]);
  useEffect(() => {
    cgRef.current?.set({ orientation });
  }, [orientation]);
  const topPlayer = againstBot
    ? {
        name: bot.name,
        startingRating: bot.rating,
        avatar: <BotAvatar rating={bot.rating} className="size-8 rounded-lg" />,
      }
    : friend
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
        // No rating beside the name against a bot: the game isn't rated
        startingRating: againstBot ? undefined : ratingFor(user, timeControl.format),
        avatar: <PlayerAvatar username={username} avatarUrl={image} size="sm" />,
      }}
      topPlayerClock={againstBot ? undefined : <ClockFace>{startingTime}</ClockFace>}
      bottomPlayerClock={againstBot ? undefined : <ClockFace>{startingTime}</ClockFace>}
    />
  );
};
