import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from "@/lib/utils";
import { DEFAULT_AVATAR_URL } from "@/constants/defaults";
import { getInitials } from "./avatarInitials";

interface UserAvatarProps {
  src?: string | null;
  username: string;
  className?: string;
  /**
   * Text for screen readers. Defaults to "" (decorative) because the name is
   * almost always shown next to the avatar. Pass the name when it isn't.
   */
  alt?: string;
  /** e.g. a bigger text size for large avatars */
  fallbackClassName?: string;
}

/** A player's photo, or their initials when they have none. */
export const UserAvatar = ({
  src,
  username,
  alt = "",
  className,
  fallbackClassName,
}: UserAvatarProps) => {
  // The generic silhouette counts as "no photo", so everyone without one gets
  // the same initials fallback
  const image = src && src !== DEFAULT_AVATAR_URL ? src : undefined;
  const decorative = alt === "";

  return (
    <Avatar
      className={cn("size-12", className)}
      aria-hidden={decorative || undefined}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : alt}
    >
      {image && <AvatarImage src={image} alt="" />}
      <AvatarFallback
        className={cn("font-semibold", fallbackClassName)}
        aria-hidden="true"
      >
        {getInitials(username)}
      </AvatarFallback>
    </Avatar>
  );
};
