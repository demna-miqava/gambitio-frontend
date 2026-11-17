import { Link, Outlet } from "react-router-dom";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { NotFound } from "@/components/NotFound";
import { Button } from "@/components/ui/button";
import { getGameRoute } from "@/constants/routes";
import { useActiveGameStatus } from "./useActiveGame";

/**
 * Layout route for every page that could help in a game being played: the
 * ones that run the chess engine (analysis, game review, bots, endgame
 * exercises, puzzle analysis, study rooms) and the opening repertoire. While
 * the player has a live game those pages aren't rendered at all, in any tab,
 * so no engine is started; one that's open when a game starts is closed,
 * which stops its engine.
 *
 * The pages stay closed until the server has said the player isn't in a
 * game: a slow or failed check must not open them.
 */
export const FairPlayGate = () => {
  const status = useActiveGameStatus();

  if (status.state === "idle") return <Outlet />;

  if (status.state === "checking") {
    return <FullScreenLoader height="h-[60vh] w-full" />;
  }

  if (status.state === "unknown") {
    return (
      <NotFound
        code=""
        title="Couldn't open this page"
        description="We couldn't check whether you have a game in progress. Check your connection and try again."
        action={<Button onClick={status.retry}>Retry</Button>}
      />
    );
  }

  return (
    <NotFound
      code=""
      title="Not available during a game"
      description="Analysis, study rooms, your repertoire, bots and the engine are closed while you have a game in progress. They'll be back as soon as it ends."
      action={
        <Button asChild>
          <Link to={getGameRoute(status.gameId)}>Return to game</Link>
        </Button>
      }
    />
  );
};
