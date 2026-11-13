import { UserAvatar } from "./UserAvatar";
import { cn } from "@/lib/utils";

interface PlayerAvatarProps {
  username: string;
  avatarUrl?: string | null;
  /** Kept for callers; opponents get the same initials fallback as everyone */
  isOpponent?: boolean;
  size?: "sm" | "md";
  /** Screen reader text; decorative by default since the name is shown */
  alt?: string;
}

export const PlayerAvatar = ({
  username,
  avatarUrl,
  size = "md",
  alt,
}: PlayerAvatarProps) => (
  <UserAvatar
    src={avatarUrl}
    username={username}
    alt={alt}
    className={cn("shrink-0 rounded-lg", size === "sm" ? "size-8" : "size-10")}
  />
);
