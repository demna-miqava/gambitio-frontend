import {
  Eye,
  Home,
  Medal,
  Settings,
  Swords,
  Microscope,
  Target,
  Trophy,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import {
  ROUTES,
  getProfileGamesRoute,
  getProfileRoute,
  getPuzzleModeRoute,
} from "@/constants/routes";

export interface NavSubItem {
  title: string;
  url: string;
  /** Router state passed with the link (e.g. which Play section to open) */
  state?: Record<string, unknown>;
}

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  /**
   * Paths that mark this item as active: the path itself or anything under it
   * ("/profile/1" matches "/profile/1/stats" but not "/profile/12"). A prefix
   * ending in "/" matches anything that starts with it.
   */
  match: string[];
  /** Paths under `match` that belong to another item */
  exclude?: string[];
  /** Left out of the phone bottom bar (five slots); still in the sidebar sheet */
  hideInBottomNav?: boolean;
  items?: NavSubItem[];
}

/**
 * Primary navigation, shared by the desktop sidebar and the mobile bottom bar.
 * Profile-dependent links need the signed-in user's id.
 */
export const getNavItems = (userId: number): NavItem[] => [
  {
    title: "Home",
    url: ROUTES.HOME,
    icon: Home,
    match: [ROUTES.HOME],
  },
  {
    title: "Play",
    url: ROUTES.PLAY,
    icon: Swords,
    match: [
      ROUTES.PLAY,
      ROUTES.PLAY_BOTS,
      ROUTES.BOT_GAME,
      ROUTES.TABLE,
      "/game/",
      // A series is played as games
      "/series/",
      // Game history is listed under Play, so it highlights Play
      getProfileGamesRoute(userId),
    ],
    items: [
      { title: "Play online", url: ROUTES.PLAY, state: { section: "new" } },
      {
        title: "Play a friend",
        url: ROUTES.PLAY,
        state: { section: "friends" },
      },
      { title: "Play the computer", url: ROUTES.PLAY_BOTS },
      { title: "Table mode", url: ROUTES.TABLE },
      { title: "Game history", url: getProfileGamesRoute(userId) },
    ],
  },
  {
    title: "Watch",
    url: ROUTES.WATCH,
    icon: Eye,
    // Watching a game happens on /game/:id, which stays under Play
    match: [ROUTES.WATCH],
    hideInBottomNav: true,
  },
  {
    title: "Tournaments",
    url: ROUTES.TOURNAMENTS,
    icon: Medal,
    // A tournament's games are played on /game/:id, which stays under Play
    match: [ROUTES.TOURNAMENTS],
    hideInBottomNav: true,
  },
  {
    // Everything you practise: puzzles, endgames, drills, coordinates, your openings
    title: "Train",
    url: ROUTES.PUZZLES,
    icon: Target,
    match: [
      ROUTES.PUZZLES,
      ROUTES.ENDGAMES,
      ROUTES.CONVERSION_DRILLS,
      ROUTES.COORDINATES,
      ROUTES.REPERTOIRE,
    ],
    items: [
      { title: "Solve puzzles", url: getPuzzleModeRoute("infinite") },
      { title: "Puzzle Rush", url: getPuzzleModeRoute("rush") },
      { title: "Survival", url: getPuzzleModeRoute("survival") },
      { title: "Calculate first", url: getPuzzleModeRoute("calculate") },
      { title: "Puzzle duel", url: ROUTES.PUZZLE_DUEL },
      { title: "Endgame lab", url: ROUTES.ENDGAMES },
      { title: "Conversion drills", url: ROUTES.CONVERSION_DRILLS },
      { title: "Coordinates", url: ROUTES.COORDINATES },
      { title: "Opening repertoire", url: ROUTES.REPERTOIRE },
    ],
  },
  {
    title: "Leaderboard",
    url: ROUTES.LEADERBOARD,
    icon: Trophy,
    match: [ROUTES.LEADERBOARD],
    hideInBottomNav: true,
  },
  {
    title: "Analysis",
    url: ROUTES.TOOLS.ANALYSIS_BOARD,
    icon: Microscope,
    match: [
      ROUTES.TOOLS.ANALYSIS_BOARD,
      ROUTES.TOOLS.BOARD_EDITOR,
      ROUTES.TOOLS.IMPORT_GAME,
      "/archive/",
      ROUTES.STUDY,
    ],
    items: [
      { title: "Analysis board", url: ROUTES.TOOLS.ANALYSIS_BOARD },
      { title: "Board editor", url: ROUTES.TOOLS.BOARD_EDITOR },
      { title: "Study rooms", url: ROUTES.STUDY },
      { title: "Import a game", url: ROUTES.TOOLS.IMPORT_GAME },
    ],
  },
  {
    title: "Profile",
    url: getProfileRoute(userId),
    icon: UserRound,
    match: [getProfileRoute(userId)],
    exclude: [getProfileGamesRoute(userId)],
  },
];

/** The items that fit the phone bottom bar. */
export const getBottomNavItems = (userId: number): NavItem[] =>
  getNavItems(userId).filter((item) => !item.hideInBottomNav);

export const SETTINGS_NAV_ITEM: NavItem = {
  title: "Settings",
  url: ROUTES.SETTINGS,
  icon: Settings,
  match: [ROUTES.SETTINGS],
};

export const matchesPath = (pathname: string, prefix: string) =>
  prefix.endsWith("/")
    ? pathname.startsWith(prefix)
    : pathname === prefix || pathname.startsWith(`${prefix}/`);

export const isNavItemActive = (item: NavItem, pathname: string) =>
  item.match.some((prefix) => matchesPath(pathname, prefix)) &&
  !item.exclude?.some((prefix) => matchesPath(pathname, prefix));

/** Accessible name for a nav item with a count: "Play, 2 challenges". */
export const navItemLabel = (title: string, challenges?: number) =>
  challenges
    ? `${title}, ${challenges} ${challenges === 1 ? "challenge" : "challenges"}`
    : title;
