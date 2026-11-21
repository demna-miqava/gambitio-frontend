import { Route, Routes } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { AppLayout } from "@/components/AppLayout";
import { FairPlayGate } from "@/components/active-game/FairPlayGate";
import {
  AnalysisBoard,
  ArchiveGame,
  BotGame,
  BoardEditor,
  TableMode,
  TableGame,
  CurrentGame,
  EndgameExercise,
  EndgameLab,
  ConversionDrills,
  ConversionDrill,
  Coordinates,
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
  PuzzleDuel,
  PuzzleDuelGame,
  PuzzlesLanding,
  Repertoire,
  Series,
  Settings,
  SharedGame,
  SignIn,
  SignUp,
  StudyRoom,
  StudyRooms,
  Tournament,
  Tournaments,
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
        <Route path={ROUTES.GAME} element={<CurrentGame />} />
        <Route path={ROUTES.WATCH} element={<Watch />} />
        <Route path={ROUTES.SETTINGS} element={<Settings />} />
        <Route path={ROUTES.PUZZLES} element={<PuzzlesLanding />} />
        <Route path={ROUTES.LEADERBOARD} element={<Leaderboard />} />
        <Route path={ROUTES.SERIES} element={<Series />} />
        <Route path={ROUTES.STUDY} element={<StudyRooms />} />
        <Route path={ROUTES.ENDGAMES} element={<EndgameLab />} />
        {/* No engine and nothing about the game in it: open during a live game too */}
        <Route path={ROUTES.COORDINATES} element={<Coordinates />} />
        <Route path={ROUTES.TOURNAMENTS} element={<Tournaments />} />
        <Route path={ROUTES.TOURNAMENT} element={<Tournament />} />
        {/* Engine, analysis and opening preparation: closed while you're in a live game */}
        <Route element={<FairPlayGate />}>
          <Route path={ROUTES.BOT_GAME} element={<BotGame />} />
          {/* Like bots: no table games while you have a live one */}
          <Route path={ROUTES.TABLE} element={<TableMode />} />
          <Route path={ROUTES.TABLE_GAME} element={<TableGame />} />
          <Route path={ROUTES.ARCHIVE_GAME} element={<ArchiveGame />} />
          <Route path={ROUTES.PUZZLE_MODE} element={<PuzzleModePage />} />
          {/* Puzzles like the other modes: not while you're in a live game */}
          <Route path={ROUTES.PUZZLE_DUEL} element={<PuzzleDuel />} />
          <Route path={ROUTES.PUZZLE_DUEL_GAME} element={<PuzzleDuelGame />} />
          <Route path={ROUTES.TOOLS.IMPORT_GAME} element={<ImportGame />} />
          <Route path={ROUTES.TOOLS.ANALYSIS_BOARD} element={<AnalysisBoard />} />
          {/* Leads to analysis and bots, so closed with them */}
          <Route path={ROUTES.TOOLS.BOARD_EDITOR} element={<BoardEditor />} />
          <Route path={ROUTES.ENDGAME_EXERCISE} element={<EndgameExercise />} />
          {/* Scanning games and playing drills both run Stockfish */}
          <Route path={ROUTES.CONVERSION_DRILLS} element={<ConversionDrills />} />
          <Route path={ROUTES.CONVERSION_DRILL} element={<ConversionDrill />} />
          <Route path={ROUTES.STUDY_ROOM} element={<StudyRoom />} />
          <Route path={ROUTES.REPERTOIRE} element={<Repertoire />} />
        </Route>
        {/* Signed-out users never get here: AuthGuard sends them to sign in */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path={ROUTES.LANDING} element={<IntroPage />} />
      <Route path={ROUTES.AUTH.SIGN_IN} element={<SignIn />} />
      <Route path={ROUTES.AUTH.SIGN_UP} element={<SignUp />} />
      <Route path={ROUTES.AUTH.PROFILE_SETUP} element={<ProfileSetup />} />
      {/* Open to everyone, outside the signed-in shell (see AuthGuard) */}
      <Route path={ROUTES.SHARED_GAME} element={<SharedGame />} />
    </Routes>
  );
};
