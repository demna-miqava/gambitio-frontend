import { getProfileFriendsRoute } from "@/constants/routes";

/** The friends page's query param for which friends to list */
export const FRIENDS_SHOW_PARAM = "show";
export type FriendsShow = "all" | "online";

/** Your friends page, showing only friends who are online or playing. */
export const getOnlineFriendsRoute = (userId: number) =>
  `${getProfileFriendsRoute(userId)}?${FRIENDS_SHOW_PARAM}=online`;
