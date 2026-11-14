import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Microscope } from "lucide-react";
import { SectionHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { useUserGames } from "@/features/game-table/hooks/useUserGames";
import { getResult } from "@/features/game-table/utils/gameResult";
import { ResultBadge } from "@/features/game-table/components/ResultBadge";
import { TimeControlCell } from "@/features/game-table/components/TimeControlCell";
import { BotTag } from "@/features/game-table/components/PlayerCell";
import RatingDelta from "@/features/stats/components/RatingDelta";
import { isBotGame } from "@/utils/storedGame";
import { fullMoves } from "@/utils/moves";
import { getGameReviewRoute } from "@/constants/routes";
import { HOME_GAMES_LIMIT } from "./constants";

/**
 * The player's latest finished game with a button that opens it with the
 * computer review running. Renders nothing until they've finished one.
 * Shares its query with the recent games list (same page and limit), which
 * then starts from the game before this one.
 */
export const LastGameCard = () => {
  const { id } = useUser();
  const { games } = useUserGames({ defaultLimit: HOME_GAMES_LIMIT });
  const game = games[0];
  // The history also lists a game still being played: nothing to review yet
  if (!game || game.status !== "finished" || !id) return null;

  const me = game.whitePlayer.id === id ? game.whitePlayer : game.blackPlayer;
  const opponent = me === game.whitePlayer ? game.blackPlayer : game.whitePlayer;
  const result = getResult(game, id);
  const playedAgo = formatDistanceToNow(new Date(game.createdAt), { addSuffix: true });

  return (
    <section
      aria-labelledby="last-game-title"
      className="space-y-4 rounded-2xl border border-border/70 bg-card p-5"
    >
      <SectionHeader title={<span id="last-game-title">Your last game</span>} />

      <div className="flex items-center gap-3">
        <ResultBadge result={result} className="shrink-0" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-foreground">
            <span className="shrink-0 font-normal text-muted-foreground">vs</span>
            <span className="truncate">{opponent.username}</span>
            {isBotGame(game) && <BotTag />}
            <span className="shrink-0 font-normal tabular-nums text-muted-foreground">
              ({opponent.rating})
            </span>
          </p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <TimeControlCell type={game.type} time={game.time} increment={game.increment} />
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{fullMoves(game.numMoves)} moves</span>
            <span aria-hidden="true">·</span>
            <span>{playedAgo}</span>
            {me.ratingChange ? (
              <>
                <span aria-hidden="true">·</span>
                <RatingDelta delta={me.ratingChange} className="font-medium" />
              </>
            ) : null}
          </p>
        </div>
      </div>

      <Button asChild size="lg" className="w-full">
        <Link to={getGameReviewRoute(game.id)}>
          <Microscope aria-hidden="true" />
          Review game
        </Link>
      </Button>
    </section>
  );
};
