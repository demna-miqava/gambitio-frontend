import { ROUTES } from "@/constants/routes";

/**
 * Pages where a game is being played. On phones they get the whole screen:
 * a compact top bar without the menu button and no bottom nav.
 */
const GAME_ROUTE_PREFIXES = ["/game/", ROUTES.BOT_GAME];

export const isGameRoute = (pathname: string) =>
  GAME_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
