import { GameTable } from "@/features/game-table";
import { Header } from "@/components/home/Header";
import { QuickPairing } from "@/components/home/QuickPairing";
import { PlayOptions } from "@/components/home/PlayOptions";
import { ResultsSummary } from "@/components/home/ResultsSummary";
import { TopPlayers } from "@/features/leaderboard/components/TopPlayers";
import { ReturnToGameBanner } from "@/components/active-game/ReturnToGame";
import { useUser } from "@/hooks/useUser";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getProfileGamesRoute } from "@/constants/routes";
import { PageContainer } from "@/components/PageContainer";

const Home = () => {
  const { id } = useUser();
  useDocumentTitle("Home");

  return (
    <PageContainer className="space-y-8 lg:space-y-10">
      <ReturnToGameBanner />
      <Header />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
        <QuickPairing />
        <PlayOptions />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
        <GameTable variant="preview" actionHref={getProfileGamesRoute(id || 0)} />
        <aside className="space-y-6">
          <ResultsSummary />
          <TopPlayers />
        </aside>
      </div>
    </PageContainer>
  );
};

export default Home;
