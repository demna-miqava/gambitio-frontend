import type { FriendStatus } from "@/types";

export type Presence = Pick<FriendStatus, "status" | "gameType">;

/** One word for under a small avatar: "Online" or "Playing" */
export const statusWord = (status: FriendStatus["status"]) => (status === "online" ? "Online" : "Playing");

/** "Online", or "Playing blitz" (just "Playing" if the time control isn't known). */
export const presenceLabel = ({ status, gameType }: Presence) =>
  status === "online" ? "Online" : gameType ? `Playing ${gameType}` : "Playing";
