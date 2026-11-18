import { lazy, type ComponentType } from "react";
import { matchPath } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

type PageModule = { default: ComponentType };

/**
 * A lazy page that can also be fetched ahead of time. `preload()` and the
 * first render share one request, so preloading never downloads twice.
 */
const page = (load: () => Promise<PageModule>) => {
  let pending: Promise<PageModule> | undefined;
  const preload = () =>
    (pending ??= load().catch((error) => {
      // Let a later render or preload try again
      pending = undefined;
      throw error;
    }));
  return Object.assign(lazy(preload), { preload });
};

// Signed-in pages
export const Home = page(() => import("@/pages/Home"));
export const Settings = page(() => import("@/pages/Settings"));
export const Play = page(() => import("@/pages/CreateGame"));
export const PlayBots = page(() => import("@/pages/PlayBots"));
export const BotGame = page(() => import("@/pages/BotGame"));
export const CurrentGame = page(() => import("@/pages/CurrentGame"));
export const ArchiveGame = page(() => import("@/pages/ArchiveGame"));
export const Watch = page(() => import("@/pages/Watch"));
export const PuzzlesLanding = page(() => import("@/pages/PuzzlesLanding"));
export const PuzzleModePage = page(() => import("@/pages/PuzzleModePage"));
export const ImportGame = page(() => import("@/pages/ImportGame"));
export const AnalysisBoard = page(() => import("@/pages/AnalysisBoard"));
export const Leaderboard = page(() => import("@/pages/Leaderboard"));
export const Series = page(() => import("@/pages/Series"));
export const Repertoire = page(() => import("@/pages/Repertoire"));
export const StudyRooms = page(() => import("@/pages/StudyRooms"));
export const StudyRoom = page(() => import("@/pages/StudyRoom"));
export const Tournaments = page(() => import("@/pages/Tournaments"));
export const Tournament = page(() => import("@/pages/Tournament"));
export const EndgameLab = page(() => import("@/pages/EndgameLab"));
export const EndgameExercise = page(() => import("@/pages/EndgameExercise"));
export const ConversionDrills = page(() => import("@/pages/ConversionDrills"));
export const ConversionDrill = page(() => import("@/pages/ConversionDrill"));
export const NotFoundPage = page(() => import("@/pages/NotFoundPage"));
// Profile
export const Profile = page(() => import("@/pages/Profile"));
export const ProfileStats = page(() => import("@/pages/ProfileStats"));
export const ProfileOverview = page(() => import("@/pages/ProfileOverview"));
export const ProfileGames = page(() => import("@/pages/ProfileGames"));
export const ProfileFriends = page(() => import("@/pages/ProfileFriends"));
// Public
export const SignIn = page(() => import("@/pages/SignIn"));
export const SignUp = page(() => import("@/pages/SignUp"));
export const IntroPage = page(() => import("@/pages/IntroPage"));
export const ProfileSetup = page(() => import("@/pages/ProfileSetup"));
export const SharedGame = page(() => import("@/pages/SharedGame"));

/**
 * The pages most visits go to, main destinations first: fetched in the
 * background after startup so these links open at once. The rest load when
 * opened (React Router keeps the old page on screen meanwhile).
 */
const IDLE_PRELOAD_PAGES = [
  Home,
  Play,
  CurrentGame,
  ArchiveGame,
  PuzzlesLanding,
  Profile,
  ProfileOverview,
];

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

/** Data saver on, or a 2G/3G connection: don't spend the user's data ahead of time. */
export const isConstrainedConnection = (
  connection: NetworkInformation | undefined = (navigator as { connection?: NetworkInformation })
    .connection
) =>
  !!connection &&
  (connection.saveData === true || /^(slow-2g|2g|3g)$/.test(connection.effectiveType ?? ""));

/**
 * Fetch the most visited signed-in pages once the browser is idle after
 * startup, so following those links renders at once instead of waiting on
 * the chunk (React Router keeps the old page on screen until the new one's
 * code arrives, which reads as a frozen click). Skipped on slow or
 * data-saving connections.
 *
 * Runs only right after the app loads: the chunks it asks for are the ones
 * this build just shipped, so it can't hit stale chunks after a deploy
 * (which would trigger reloadOnStaleChunks mid-session).
 */
export const preloadSignedInPages = () => {
  if (isConstrainedConnection()) return () => {};

  const run = () => {
    for (const p of IDLE_PRELOAD_PAGES) {
      // A failed preload is retried by the page's own render
      p.preload().catch(() => {});
    }
  };

  // Safari has no requestIdleCallback
  if (typeof requestIdleCallback === "function") {
    const id = requestIdleCallback(run, { timeout: 3000 });
    return () => cancelIdleCallback(id);
  }
  const id = setTimeout(run, 1500);
  return () => clearTimeout(id);
};

type Page = { preload: () => Promise<PageModule> };

/** Each route's page(s), as AppRoutes renders them (Profile wraps its tabs). */
const ROUTE_PAGES: [pattern: string, pages: Page[]][] = [
  [ROUTES.LANDING, [IntroPage]],
  [ROUTES.AUTH.SIGN_IN, [SignIn]],
  [ROUTES.AUTH.SIGN_UP, [SignUp]],
  [ROUTES.AUTH.PROFILE_SETUP, [ProfileSetup]],
  [ROUTES.SHARED_GAME, [SharedGame]],
  [ROUTES.HOME, [Home]],
  [ROUTES.PROFILE.ROOT, [Profile, ProfileOverview]],
  [`${ROUTES.PROFILE.ROOT}/${ROUTES.PROFILE.GAMES}`, [Profile, ProfileGames]],
  [`${ROUTES.PROFILE.ROOT}/${ROUTES.PROFILE.STATS}`, [Profile, ProfileStats]],
  [`${ROUTES.PROFILE.ROOT}/${ROUTES.PROFILE.FRIENDS}`, [Profile, ProfileFriends]],
  [ROUTES.PLAY, [Play]],
  [ROUTES.PLAY_BOTS, [PlayBots]],
  [ROUTES.BOT_GAME, [BotGame]],
  [ROUTES.GAME, [CurrentGame]],
  [ROUTES.ARCHIVE_GAME, [ArchiveGame]],
  [ROUTES.WATCH, [Watch]],
  [ROUTES.SETTINGS, [Settings]],
  [ROUTES.PUZZLES, [PuzzlesLanding]],
  [ROUTES.PUZZLE_MODE, [PuzzleModePage]],
  [ROUTES.LEADERBOARD, [Leaderboard]],
  [ROUTES.SERIES, [Series]],
  [ROUTES.REPERTOIRE, [Repertoire]],
  [ROUTES.STUDY, [StudyRooms]],
  [ROUTES.STUDY_ROOM, [StudyRoom]],
  [ROUTES.TOURNAMENTS, [Tournaments]],
  [ROUTES.TOURNAMENT, [Tournament]],
  [ROUTES.ENDGAMES, [EndgameLab]],
  [ROUTES.ENDGAME_EXERCISE, [EndgameExercise]],
  [ROUTES.CONVERSION_DRILLS, [ConversionDrills]],
  [ROUTES.CONVERSION_DRILL, [ConversionDrill]],
  [ROUTES.TOOLS.IMPORT_GAME, [ImportGame]],
  [ROUTES.TOOLS.ANALYSIS_BOARD, [AnalysisBoard]],
];

/** The pages AppRoutes renders for `pathname`; empty when none matches. */
export const pagesForPath = (pathname: string): Page[] =>
  ROUTE_PAGES.find(([pattern]) => matchPath(pattern, pathname))?.[1] ?? [];

/**
 * Start downloading the page for the URL the app opens on, before the first
 * render: otherwise its chunk only starts once AuthGuard has waited for
 * Clerk and the profile status, a needless round trip on every cold load.
 * Same request as the page's own render (see page()), so nothing loads twice.
 */
export const preloadPageFor = (pathname: string) => {
  for (const p of pagesForPath(pathname)) p.preload().catch(() => {});
};
