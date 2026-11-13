import { Route, Routes } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { AppLayout } from "@/components/AppLayout";
import {
  AnalysisBoard,
  ArchiveGame,
  BotGame,
  CurrentGame,
  Home,
  ImportGame,
  IntroPage,
  Leaderboard,
  NotFoundPage,
  Play,
  PlayBots,
  Profile,
  ProfileFriends,
  ProfileGames,
  ProfileOverview,
  ProfileSetup,
  ProfileStats,
  PuzzleModePage,
  PuzzlesLanding,
  Settings,
  SignIn,
  SignUp,
  Watch,
} from "./pages";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.PROFILE.ROOT} element={<Profile />}>
          <Route index element={<ProfileOverview />} />
          <Route path={ROUTES.PROFILE.GAMES} element={<ProfileGames />} />
          <Route path={ROUTES.PROFILE.STATS} element={<ProfileStats />} />
          <Route path={ROUTES.PROFILE.FRIENDS} element={<ProfileFriends />} />
        </Route>
        <Route path={ROUTES.PLAY} element={<Play />} />
        <Route path={ROUTES.PLAY_BOTS} element={<PlayBots />} />
        <Route path={ROUTES.BOT_GAME} element={<BotGame />} />
        <Route path={ROUTES.GAME} element={<CurrentGame />} />
        <Route path={ROUTES.ARCHIVE_GAME} element={<ArchiveGame />} />
        <Route path={ROUTES.WATCH} element={<Watch />} />
        <Route path={ROUTES.SETTINGS} element={<Settings />} />
        <Route path={ROUTES.PUZZLES} element={<PuzzlesLanding />} />
        <Route path={ROUTES.PUZZLE_MODE} element={<PuzzleModePage />} />
        <Route path={ROUTES.TOOLS.IMPORT_GAME} element={<ImportGame />} />
        <Route path={ROUTES.TOOLS.ANALYSIS_BOARD} element={<AnalysisBoard />} />
        <Route path={ROUTES.LEADERBOARD} element={<Leaderboard />} />
        {/* Signed-out users never get here: AuthGuard sends them to sign in */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path={ROUTES.LANDING} element={<IntroPage />} />
      <Route path={ROUTES.AUTH.SIGN_IN} element={<SignIn />} />
      <Route path={ROUTES.AUTH.SIGN_UP} element={<SignUp />} />
      <Route path={ROUTES.AUTH.PROFILE_SETUP} element={<ProfileSetup />} />
    </Routes>
  );
};
