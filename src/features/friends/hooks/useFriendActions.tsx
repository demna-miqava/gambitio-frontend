import { useNavigate } from "react-router-dom";
import { useSendFriendRequest } from "../suggestions/hooks/useSendFriendRequest";
import { useRemoveFriend } from "./useRemoveFriend";
import type { Friend } from "@/types";
import {
  getChallengeFriendRoute,
  type PlaySetupState,
} from "@/features/create-game/utils/setupRoute";

export const useFriendActions = () => {
  const navigate = useNavigate();
  const sendFriendRequestMutation = useSendFriendRequest();
  const removeFriendMutation = useRemoveFriend();

  const onChallenge = (friend: Friend) => {
    const { username, avatarUrl, blitzRating, bulletRating, rapidRating, id } =
      friend;
    // The friend in the state shows the form without a fetch; the URL alone
    // (?section=friends&friend=12) works too, e.g. after a reload
    const state: PlaySetupState = {
      selectedFriend: {
        id,
        username,
        avatarUrl,
        blitzRating,
        bulletRating,
        rapidRating,
      },
    };
    navigate(getChallengeFriendRoute(id), { state });
  };

  const onRemove = (id: number) => {
    removeFriendMutation.mutate(id);
  };

  const onAddFriend = (id: number) => {
    sendFriendRequestMutation.mutate(id);
  };

  return {
    onChallenge,
    onRemove,
    onAddFriend,
  };
};
