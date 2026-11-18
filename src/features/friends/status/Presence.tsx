import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { FriendStatus } from "@/types";
import { presenceLabel, type Presence } from "./presenceLabel";

/** Green for online (free to challenge), gold for playing (busy). */
const dotColor = (status: FriendStatus["status"]) =>
  status === "online" ? "bg-success" : "bg-gold";

/**
 * An avatar with a status dot on its corner when the friend is online or
 * playing; no dot when they're offline. The dot is the only status shown
 * on friend lists and profiles, so it carries the words too ("Online",
 * "Playing blitz") as its accessible name and a hover tooltip.
 */
export const AvatarWithPresence = ({
  presence,
  children,
  className,
  dotClassName,
  announce = true,
}: {
  presence: Presence | null | undefined;
  children: ReactNode;
  className?: string;
  /** e.g. a bigger dot, or a ring in the colour of what's behind the avatar */
  dotClassName?: string;
  /** Off where the status is already said in text next to the avatar */
  announce?: boolean;
}) => (
  <span className={cn("relative inline-flex shrink-0", className)}>
    {children}
    {presence && (
      <span
        {...(announce
          ? { role: "img", "aria-label": presenceLabel(presence), title: presenceLabel(presence) }
          : { "aria-hidden": true })}
        className={cn(
          "absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-card",
          dotColor(presence.status),
          dotClassName
        )}
      />
    )}
  </span>
);
