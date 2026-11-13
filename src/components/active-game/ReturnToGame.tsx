import { Link } from "react-router-dom";
import { ArrowRight, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { getGameRoute } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { useActiveGame } from "./useActiveGame";

const LABEL = "Return to your game in progress";

/** Small pulsing dot: "something is live". */
const LiveDot = ({ className }: { className?: string }) => (
  <span className={cn("relative flex size-2 shrink-0", className)} aria-hidden="true">
    <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60 motion-reduce:animate-none" />
    <span className="relative inline-flex size-2 rounded-full bg-current" />
  </span>
);

/** Home: a card above everything else while a game is waiting for you. */
export const ReturnToGameBanner = () => {
  const gameId = useActiveGame();
  if (gameId === null) return null;

  return (
    <section
      aria-label="Game in progress"
      className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-brand-soft p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Swords className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-semibold text-foreground">
            <LiveDot className="text-primary" />
            Game in progress
          </p>
          <p className="text-sm text-muted-foreground">
            Pick up where you left off.
          </p>
        </div>
      </div>
      <Button asChild className="h-11 sm:h-10">
        <Link to={getGameRoute(gameId)}>
          Return to game <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </section>
  );
};

/** Phone top bar: a compact pill next to the brand. */
export const ReturnToGameTopBarLink = () => {
  const gameId = useActiveGame();
  if (gameId === null) return null;

  return (
    <Link
      to={getGameRoute(gameId)}
      aria-label={LABEL}
      data-return-to-game=""
      className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-primary px-2.5 text-xs font-semibold text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <LiveDot />
      Return to game
    </Link>
  );
};

/** Sidebar (rail and full): first item, so it's visible on every page. */
export const ReturnToGameSidebarItem = () => {
  const gameId = useActiveGame();
  const { setOpenMobile } = useSidebar();
  if (gameId === null) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          tooltip="Return to game"
          className="relative h-10 gap-3 bg-primary font-semibold text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground [&>svg]:size-[18px]"
        >
          <Link
            to={getGameRoute(gameId)}
            aria-label={LABEL}
            onClick={() => setOpenMobile(false)}
          >
            <Swords aria-hidden="true" />
            <LiveDot className="absolute top-1.5 right-1.5 hidden text-primary-foreground group-data-[collapsible=icon]:flex" />
            <span>Return to game</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
