import FriendsGrid from "@/features/friends/list/components/FriendsGrid";
import { GameTable } from "@/features/game-table";
import PerformanceShowcase from "@/features/stats/components/performance/PerformanceShowcase";
import { useProfileUserId } from "@/hooks/useProfileUserId";
import { getProfileGamesRoute } from "@/constants/routes";
import { useUser } from "@/hooks/useUser";
import { HeadToHeadCard } from "@/features/series/components/HeadToHeadCard";
import { UserSeriesCard } from "@/features/series/components/UserSeriesCard";

const ProfileOverview = () => {
  const userId = useProfileUserId();
  const { id: viewerId } = useUser();
  const isOwnProfile = userId === viewerId;

  const profileGamesHref = getProfileGamesRoute(userId);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6">
      <div className="space-y-6">
        <PerformanceShowcase />
        <GameTable variant="preview" actionHref={profileGamesHref} />
      </div>
      <aside className="flex flex-col gap-4">
        {/* Your record against this player */}
        {!isOwnProfile && viewerId !== undefined && userId > 0 && (
          <HeadToHeadCard userId={userId} viewerId={viewerId} />
        )}
        <FriendsGrid />
        {userId > 0 && <UserSeriesCard userId={userId} viewerId={viewerId} />}
      </aside>
    </div>
  );
};

export default ProfileOverview;
