import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { getSharedGame } from "@/services/game";
import { QKEY_SHARED_GAME } from "@/constants/queryKeys";
import type { StoredGame } from "@/types";

/** True when the link points at nothing: never made, turned off, or mistyped. */
export const isLinkOff = (error: unknown) =>
  isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 400);

/**
 * The game behind a share link. Works signed out.
 * @param token - Parsed with parseShareToken; null fetches nothing
 */
export const useSharedGame = (token: string | null) =>
  useQuery<StoredGame>({
    queryKey: [QKEY_SHARED_GAME, token],
    queryFn: () => getSharedGame(token!),
    enabled: token !== null,
    // A link that is off stays off: asking again only delays saying so
    retry: (failureCount, error) => !isLinkOff(error) && failureCount < 1,
  });
