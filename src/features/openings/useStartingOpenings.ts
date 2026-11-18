import { useQuery } from "@tanstack/react-query";
import { QKEY_STARTING_OPENINGS } from "@/constants/queryKeys";
import { getStartingOpenings } from "@/services/openings";

/** The list only changes with a deploy: fetched once per session */
export const useStartingOpenings = () =>
  useQuery({
    queryKey: [QKEY_STARTING_OPENINGS],
    queryFn: getStartingOpenings,
    staleTime: Infinity,
    gcTime: Infinity,
  });
