import { Link } from "react-router-dom";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { ROUTES, getProfileRoute } from "@/constants/routes";
import { BrandLogo } from "@/components/Brand";
import { UserAvatar } from "@/components/UserAvatar";
import { ReturnToGameTopBarLink } from "@/components/active-game/ReturnToGame";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";

const barClass =
  "sticky top-0 z-30 flex items-center border-b border-border/60 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70";

/**
 * Phones only (below 768px; from there the sidebar is always on screen).
 *
 * Normal pages: the button that opens the sidebar sheet, the brand, a "Return
 * to game" link while a game is waiting, and a shortcut to the profile.
 *
 * Game pages (`compact`): a 2.5rem bar with just the brand, so the board gets
 * the room and there's no menu one tap away. Leaving through the brand link
 * is still guarded by the game page.
 *
 * Heights match --app-top-bar-height set in AppLayout.
 */
export const MobileTopBar = ({ compact = false }: { compact?: boolean }) => {
  const { isMobile } = useSidebar();
  const { id, image, username } = useUser();
  if (!isMobile) return null;

  if (compact) {
    return (
      <header className={cn(barClass, "h-10 px-3")}>
        <Link
          to={ROUTES.HOME}
          aria-label="Gambitio home"
          // The bar is 40px; touch-target makes the link a 44px tap
          className="relative touch-target flex h-full items-center rounded-lg px-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BrandLogo markClassName="size-6" textClassName="text-sm" />
        </Link>
      </header>
    );
  }

  return (
    <header className={cn(barClass, "group/topbar h-14 gap-1 px-1.5")}>
      <SidebarTrigger className="size-11" aria-label="Open menu" />
      <Link
        to={ROUTES.HOME}
        aria-label="Gambitio home"
        className="flex h-11 min-w-0 items-center rounded-lg px-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* On the narrowest phones the wordmark makes way for "Return to game" */}
        <BrandLogo
          markClassName="size-7"
          textClassName="text-base max-[379px]:group-has-data-[return-to-game]/topbar:sr-only"
        />
      </Link>
      <div className="ml-auto flex items-center gap-1">
        <ReturnToGameTopBarLink />
        {id && (
          <Link
            to={getProfileRoute(id)}
            aria-label="Your profile"
            className="flex size-11 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <UserAvatar src={image} username={username} className="size-8" />
          </Link>
        )}
      </div>
    </header>
  );
};
