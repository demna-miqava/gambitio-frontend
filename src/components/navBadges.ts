import { useIncomingChallenges } from "@/features/notifications/hooks/useIncomingChallenges";

/** Counts shown on nav items, keyed by item title. */
export const useNavBadges = (): Record<string, number | undefined> => {
  const { data } = useIncomingChallenges();
  return { Play: data?.length || undefined };
};
