import { lazy, type ComponentType } from "react";

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

/** Main destinations first, so they're ready soonest */
const SIGNED_IN_PAGES = [
  Home,
  Play,
  PuzzlesLanding,
  Profile,
  ProfileOverview,
  Settings,
  Watch,
  Leaderboard,
  AnalysisBoard,
  PlayBots,
  CurrentGame,
  PuzzleModePage,
  ProfileGames,
  ProfileStats,
  ProfileFriends,
  BotGame,
  ArchiveGame,
  ImportGame,
];

/**
 * Fetch every signed-in page once the browser is idle after startup, so
 * following a link renders at once instead of waiting on its chunk (React
 * Router keeps the old page on screen until the new one's code arrives,
 * which reads as a frozen click).
 *
 * Runs only right after the app loads: the chunks it asks for are the ones
 * this build just shipped, so it can't hit stale chunks after a deploy
 * (which would trigger reloadOnStaleChunks mid-session).
 */
export const preloadSignedInPages = () => {
  const connection = (navigator as { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return () => {};

  const run = () => {
    for (const p of SIGNED_IN_PAGES) {
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
