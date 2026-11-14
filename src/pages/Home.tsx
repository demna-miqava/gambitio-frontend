import { GameTable } from "@/features/game-table";
import { Header } from "@/components/home/Header";
import { QuickPairing } from "@/components/home/QuickPairing";
import { ResultsSummary } from "@/components/home/ResultsSummary";
import { HOME_GAMES_LIMIT } from "@/components/home/constants";
import { TopPlayers } from "@/features/leaderboard/components/TopPlayers";
import { Challenges } from "@/features/create-game/components/Challenges";
import { ReturnToGameBanner } from "@/components/active-game/ReturnToGame";
import { useUser } from "@/hooks/useUser";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getProfileGamesRoute } from "@/constants/routes";
import { PageContainer } from "@/components/PageContainer";

/**
 * What to do next, not where to go (the sidebar does that): anything waiting
 * on the player first (a game in progress, challenges), then a new game, how
 * the last 30 days went, and recent games.
 */
const Home = () => {
  const { id } = useUser();
  useDocumentTitle("Home");

  return (
    <PageContainer className="space-y-8 lg:space-y-10">
      <ReturnToGameBanner />
      <Challenges className="rounded-2xl border border-border/70 bg-card p-5" />
      <Header />

      {/* One grid, so recent games follow the tiles however tall the side column is */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-6 lg:gap-y-8">
        <QuickPairing />
        <aside className="space-y-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <ResultsSummary />
          <TopPlayers />
        </aside>
        <div className="lg:col-start-1 lg:row-start-2">
          <GameTable
            variant="preview"
            limit={HOME_GAMES_LIMIT}
            actionHref={getProfileGamesRoute(id || 0)}
          />
        </div>
      </div>
    </PageContainer>
  );
};

export default Home;
