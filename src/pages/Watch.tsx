import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { PageContainer } from "@/components/PageContainer";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useUser } from "@/hooks/useUser";
import { ROUTES, getProfileFriendsRoute } from "@/constants/routes";
import {
  TOP_LIVE_GAMES_LIMIT,
  useFriendsLiveGames,
  useTopLiveGames,
} from "@/features/watch/hooks/useLiveGames";
import { LiveGamesSection } from "@/features/watch/components/LiveGamesSection";

/** Live games to watch: friends' first, then the strongest games on the site. */
const Watch = () => {
  useDocumentTitle("Watch");
  const { id: currentUserId } = useUser();
  const friends = useFriendsLiveGames();
  const top = useTopLiveGames();

  return (
    <PageContainer className="space-y-10">
      <PageHeader
        title="Watch"
        description="Follow games as they're played. Moves and clocks update live."
      />

      <LiveGamesSection
        id="friends-live-games"
        title="Friends playing now"
        games={friends.data}
        isPending={friends.isPending}
        isError={friends.isError}
        isFetching={friends.isFetching}
        onRetry={() => friends.refetch()}
        currentUserId={currentUserId}
        skeletonCount={2}
        empty={
          <>
            None of your friends are playing right now.{" "}
            {currentUserId !== undefined && (
              <Link
                to={getProfileFriendsRoute(currentUserId)}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Find friends
              </Link>
            )}
          </>
        }
      />

      {/* Rendered once the friends list has settled, so its loading cards
          collapsing to "None of your friends are playing" can't push this
          section up the page */}
      {!friends.isPending && (
        <LiveGamesSection
          id="top-live-games"
          title="Top live games"
          games={top.data}
          isPending={top.isPending}
          isError={top.isError}
          isFetching={top.isFetching}
          onRetry={() => top.refetch()}
          currentUserId={currentUserId}
          skeletonCount={Math.min(6, TOP_LIVE_GAMES_LIMIT)}
          empty={
            <>
              No games are being played right now.{" "}
              <Link
                to={ROUTES.PLAY}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Start one
              </Link>
            </>
          }
        />
      )}
    </PageContainer>
  );
};

export default Watch;
