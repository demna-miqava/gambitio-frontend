import { Link, Navigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/Brand";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { NotFound } from "@/components/NotFound";
import { ROUTES, getArchiveGameRoute, getSharedGameRoute } from "@/constants/routes";
import { withRedirect } from "@/routes/redirect";
import { useUser } from "@/hooks/useUser";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { SharedGameViewer, isLinkOff, parseShareToken, scoreText, useSharedGame } from "@/features/shared-game";

/**
 * A game someone shared (/share/<token>), for anyone who has the link.
 *
 * Signed out: the game to replay, on a page of its own with no app shell,
 * and an invitation to sign in for the engine. Signed in: the game's full
 * page (analysis, engine, review) opens instead, since a signed-in user may
 * open any game.
 */
const SharedGame = () => {
  const token = parseShareToken(useParams().token);
  const { isAuthenticated, hasProfile } = useUser();
  const { data: game, isPending, error, refetch } = useSharedGame(token);
  const score = game ? scoreText(game.result) : "";
  useDocumentTitle(
    game
      ? `${game.whitePlayer.username} vs ${game.blackPlayer.username}${score ? ` · ${score}` : ""}`
      : undefined
  );

  const here = token ? getSharedGameRoute(token) : ROUTES.LANDING;
  const signInHref = withRedirect(ROUTES.AUTH.SIGN_IN, here);
  const signUpHref = withRedirect(ROUTES.AUTH.SIGN_UP, here);
  const signedIn = isAuthenticated && hasProfile;

  if (game && signedIn) return <Navigate to={getArchiveGameRoute(game.id)} replace />;

  const linkOff = token === null || isLinkOff(error);
  return (
    // The header's height, for the board's size (see .game-layout in index.css)
    <div className="flex min-h-svh flex-col [--app-top-bar-height:3.5rem]">
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4 sm:px-6 lg:px-8">
        <Link
          to={signedIn ? ROUTES.HOME : ROUTES.LANDING}
          aria-label="Gambitio home"
          className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          <BrandLogo markClassName="size-7" textClassName="text-xl" />
        </Link>
        {signedIn ? (
          <Button asChild size="sm" variant="outline">
            <Link to={ROUTES.HOME}>Back to home</Link>
          </Button>
        ) : (
          <nav aria-label="Account" className="flex items-center gap-1.5">
            <Button asChild size="sm" variant="ghost">
              <Link to={signInHref}>Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to={signUpHref}>Play free</Link>
            </Button>
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        {linkOff ? (
          <NotFound
            code=""
            title="This link isn't active"
            description="The game was never shared with this link, or the player who shared it has turned the link off."
            action={
              <Button asChild>
                <Link to={signedIn ? ROUTES.HOME : ROUTES.LANDING}>
                  {signedIn ? "Back to home" : "Go to Gambitio"}
                </Link>
              </Button>
            }
          />
        ) : isPending ? (
          <FullScreenLoader height="h-[60vh] w-full" />
        ) : error || !game ? (
          <NotFound
            code=""
            title="Couldn't load this game"
            description="Check your connection and try again."
            action={<Button onClick={() => void refetch()}>Retry</Button>}
          />
        ) : (
          <SharedGameViewer key={game.id} game={game} signInHref={signInHref} signUpHref={signUpHref} />
        )}
      </main>
    </div>
  );
};

export default SharedGame;
