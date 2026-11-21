import { useQuery } from "@tanstack/react-query";
import { getFriendSuggestions } from "@/services/friends";
import { useUser } from "@/hooks/useUser";
import { QKEY_SUGGESTED_FRIENDS } from "@/constants/queryKeys";

/** The API rejects shorter searches */
export const MIN_PLAYER_SEARCH_LENGTH = 2;

/** Players matching `searchQuery` who aren't the user's friends yet. */
export const useSuggestedFriends = (searchQuery?: string) => {
  const { id: userId } = useUser();
  const search = searchQuery?.trim() ?? "";

  const query = useQuery({
    queryKey: [QKEY_SUGGESTED_FRIENDS, userId, search],
    queryFn: () => getFriendSuggestions(search),
    enabled: !!userId && search.length >= MIN_PLAYER_SEARCH_LENGTH,
  });

  return {
    ...query,
    suggestions: query.data?.data || [],
  };
};
