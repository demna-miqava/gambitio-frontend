import type { FriendStatus } from "@/types";

export type Presence = Pick<FriendStatus, "status" | "gameType">;

/** "Online", or "Playing blitz" (just "Playing" if the time control isn't known). */
export const presenceLabel = ({ status, gameType }: Presence) =>
  status === "online" ? "Online" : gameType ? `Playing ${gameType}` : "Playing";
