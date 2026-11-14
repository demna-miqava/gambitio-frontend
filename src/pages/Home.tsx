import { GameTable } from "@/features/game-table";
import { Header } from "@/components/home/Header";
import { QuickPlayGrid } from "@/components/home/QuickPlayGrid";
import { LastGameCard } from "@/components/home/LastGameCard";
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
 * Anything waiting on the player first (a game in progress, challenges), then
 * the quick play cards, earlier games, and beside them the last game to
 * review, how the last 30 days went and the top players.
 */
const Home = () => {
  const { id } = useUser();
  useDocumentTitle("Home");

  return (
    <PageContainer className="space-y-8 lg:space-y-10">
      <ReturnToGameBanner />
      <Challenges className="rounded-2xl border border-border/70 bg-card p-5" />
      <Header />
      <QuickPlayGrid />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
        <GameTable
          variant="preview"
          limit={HOME_GAMES_LIMIT}
          skipLatest
          actionHref={getProfileGamesRoute(id || 0)}
        />
        <aside className="space-y-4">
          <LastGameCard />
          <ResultsSummary />
          <TopPlayers />
        </aside>
      </div>
    </PageContainer>
  );
};

export default Home;
