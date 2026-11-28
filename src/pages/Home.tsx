import { useRef } from "react";
import { RecentGames } from "@/components/home/RecentGames";
import { useUserGames } from "@/features/game-table/hooks/useUserGames";
import { QuickPairing } from "@/components/home/QuickPairing";
import { PlayFriend } from "@/components/home/PlayFriend";
import { YourForm } from "@/components/home/YourForm";
import { NextPuzzle } from "@/components/home/NextPuzzle";
import { NoGamesYet } from "@/components/home/NoGamesYet";
import {
  DrillsDueRow,
  RepertoireDueRow,
  SeriesRows,
  StartHereRows,
} from "@/components/home/UpNextRows";
import { HOME_GAMES_LIMIT, HOME_GAMES_QUERY } from "@/components/home/constants";
import { pageBox, screenBottom, useRowsThatFit } from "@/components/home/useRowsThatFit";
import { TournamentBanner } from "@/features/tournaments/components/TournamentBanner";
import { ReturnToGameBanner } from "@/components/active-game/ReturnToGame";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { PageContainer } from "@/components/PageContainer";
import { SearchField } from "@/features/search/SearchField";

/**
 * What to do next, not where to go (the sidebar does that).
 *
 * Two columns from lg, the right one 328px. The first row is a new game
 * (one tap on a time control) beside the friends to challenge, the same
 * height. Under them: "Up next" (a game in progress, a series with games
 * left, a tournament, repertoire lines and drills that are due) and recent
 * games on the left; the next puzzle and the player's ratings on the right.
 *
 * Above it all, a search field: a player, an opening, or your games with
 * someone (SearchField).
 *
 * Challenges, duel invites and friend requests are answered from the
 * notifications bell in the corner (on every page), so Home doesn't repeat
 * them.
 *
 * An account with no games yet (bot and casual games count) gets "Start
 * here" in Up next's place (a bot, puzzles, the coordinates drill, the next
 * tournament), and Recent games says what will be there.
 *
 * Recent games shows as many games (3 to 8) as fit down to the bottom of
 * the screen or of the right column, whichever is lower (useRowsThatFit):
 * no empty space beside the other column, and the list alone never makes
 * the page scroll.
 *
 * Below lg the left column dissolves (`contents`) and everything stacks in
 * the order set by `order-*`: new game, up next, friends, recent games,
 * then the puzzle and the ratings (side by side from 640px).
 */
const Home = () => {
  useDocumentTitle("Home");
  const gamesRef = useRef<HTMLDivElement>(null);
  const sideRef = useRef<HTMLDivElement>(null);

  // The same request (same key) as the recent-games table and the New game
  // panel, so this only reads its cached answer
  const games = useUserGames(HOME_GAMES_QUERY);
  const isNewAccount = !games.isPending && !games.isError && games.games.length === 0;

  // As many recent games as fit (3 to 8): down to the bottom of the screen,
  // or of the other column when that is longer
  const gameRows = useRowsThatFit({
    rows: gamesRef,
    rowSelector: "tbody tr",
    bottom: () =>
      Math.max(screenBottom(), sideRef.current ? pageBox(sideRef.current).bottom : 0),
    observe: [sideRef],
    min: 3,
    max: HOME_GAMES_LIMIT,
  });

  return (
    <PageContainer className="max-w-[1248px] text-[15px] leading-[1.45] [font-variant-numeric:tabular-nums]">
      {/* From 768px in the band the shell keeps above every page for the
          notifications bell (AppLayout's md:pt-12), level with it; on phones
          the first thing on the page */}
      <SearchField className="mb-5 md:-mt-[2.625rem] md:mb-3 md:max-w-[420px] max-md:-mt-1" />
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_328px] lg:items-start lg:gap-8">
        <div className="max-lg:order-1 lg:col-start-1 lg:row-start-1 lg:min-w-0 lg:self-stretch">
          <QuickPairing />
        </div>
        <div className="max-lg:order-3 lg:col-start-2 lg:row-start-1 lg:self-stretch">
          <PlayFriend />
        </div>

        <div className="contents lg:col-start-1 lg:row-start-2 lg:grid lg:min-w-0 lg:grid-cols-1 lg:gap-8">
          {/* Whatever waits on the player. Nothing waiting: no list, no heading
              (the section only shows while it holds a row) */}
          <section aria-labelledby="up-next-title" className="hidden has-[li]:block max-lg:order-2">
            <h2 id="up-next-title" className="mb-3 font-display text-xl leading-tight sm:text-[22px]">
              {isNewAccount ? "Start here" : "Up next"}
            </h2>
            <ul className="panel overflow-hidden">
              <ReturnToGameBanner />
              <SeriesRows />
              {isNewAccount && <StartHereRows />}
              <TournamentBanner />
              {!isNewAccount && (
                <>
                  <RepertoireDueRow />
                  <DrillsDueRow />
                </>
              )}
            </ul>
          </section>

          <div ref={gamesRef} className="max-lg:order-5">
            {isNewAccount ? (
              <NoGamesYet />
            ) : (
              <RecentGames maxRows={gameRows} />
            )}
          </div>
        </div>

        <div
          ref={sideRef}
          className="grid gap-6 max-lg:order-6 sm:max-lg:grid-cols-2 sm:max-lg:items-start lg:col-start-2 lg:row-start-2 lg:gap-8"
        >
          <NextPuzzle />
          <YourForm />
        </div>
      </div>
    </PageContainer>
  );
};

export default Home;
