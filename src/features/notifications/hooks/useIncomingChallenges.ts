import { useQuery } from "@tanstack/react-query";
import { getChallenges } from "@/services/challenges";
import { QKEY_CHALLENGES } from "@/constants/queryKeys";
import { TWO_MINUTES_MS } from "@/constants/time";
import { useUser } from "@/hooks/useUser";

/**
 * Challenges other players have sent the signed-in user and that are still
 * open. Shared by the /play list, the incoming-challenge toasts and the Play
 * nav badge, so all stay in sync: the notification socket updates and
 * invalidates QKEY_CHALLENGES on every challenge message and on reconnect.
 */
export const useIncomingChallenges = () => {
  const { isAuthenticated, hasProfile } = useUser();
  return useQuery({
    queryKey: [QKEY_CHALLENGES],
    queryFn: getChallenges,
    staleTime: TWO_MINUTES_MS,
    enabled: !!isAuthenticated && !!hasProfile,
  });
};
