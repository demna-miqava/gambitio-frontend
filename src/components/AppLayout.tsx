import { Outlet, useLocation } from "react-router-dom";
import { Suspense, useEffect, useState, type MouseEvent } from "react";
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "./sidebar/AppSidebar";
import { SettingsProvider } from "@/features/settings/SettingsContext";
import { ChallengesProvider } from "@/features/notifications/context/ChallengesContext";
import { FullScreenLoader } from "./FullScreenLoader";
import { MobileTopBar } from "./MobileTopBar";
import { MobileBottomNav } from "./MobileBottomNav";
import { ErrorBoundary } from "./ErrorBoundary";
import { ChessSoundProvider } from "@/features/game/contexts/ChessSoundContext";
import { isGameRoute } from "@/config/shell";
import { useIsWideScreen } from "@/hooks/use-mobile";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { cn } from "@/lib/utils";
import { preloadSignedInPages } from "@/routes/pages";
import { StudyInviteToasts } from "@/features/study/components/StudyInviteToasts";
import { FriendUpdates } from "@/features/friends/components/FriendUpdates";
import { BlockUpdates } from "@/features/moderation/components/BlockUpdates";
import { FriendsInbox } from "@/features/friends/components/FriendsInbox";
import { DuelInviteListener } from "@/features/puzzles/duel/components/DuelInviteListener";
import { PushSync } from "@/features/push/PushSync";
import { GameShellProvider, useGameShell } from "@/context/GameShellContext";

const MAIN_ID = "main-content";
const SIDEBAR_WIDE_OPEN_KEY = "sidebarWideOpen";

// Focus <main> directly rather than following "#main-content", which would
// add a hash to the URL and count as a navigation
const skipToMain = (event: MouseEvent<HTMLAnchorElement>) => {
  const main = document.getElementById(MAIN_ID);
  if (!main) return;
  event.preventDefault();
  main.focus();
  main.scrollIntoView();
};

/**
 * The signed-in shell.
 *
 * - Below 768px: top bar (3.5rem; 2.5rem without the menu on game pages),
 *   sidebar as a sheet, bottom nav except on game pages.
 * - 768–1279px: sidebar as an icon rail (it can be expanded; it folds back
 *   on the next navigation). No top bar.
 * - From 1280px: the full sidebar, which the user can collapse to the rail.
 *
 * Friends and challenges (FriendsInbox) sit in the top right corner: in the
 * phone top bar, and from 768px in the corner of the page, which starts 3rem
 * down to leave it room. Game pages have neither.
 *
 * `--app-top-bar-height` tells pages how much of the viewport is taken above
 * their own padding, e.g. for the board's height cap: the sticky top bar on
 * phones, and from 768px the extra room kept for the corner (0px on game
 * pages).
 *
 * A game played in focus mode hides the sidebar (see index.css,
 * [data-focus-mode]); the phone top bar stays, with the way back out.
 */
/** From 768px (phones have it in the top bar): the corner of the page. */
const CornerInbox = () => {
  const { isMobile } = useSidebar();
  if (isMobile) return null;
  return (
    <div className="absolute top-1.5 right-3 z-20">
      <FriendsInbox />
    </div>
  );
};

export const AppLayout = () => (
  <GameShellProvider>
    <AppShell />
  </GameShellProvider>
);

const AppShell = () => {
  const { pathname } = useLocation();
  const { focusActive } = useGameShell();
  const onGamePage = isGameRoute(pathname);
  const isWide = useIsWideScreen();

  // Fetch the other pages' code in the background so links open instantly
  useEffect(() => preloadSignedInPages(), []);

  // Separate open states: wide screens remember the user's choice, the rail
  // on narrower ones only opens on demand
  // (stored separately from the shadcn sidebar cookie, which the rail's
  // open/close would overwrite)
  const [wideOpen, setWideOpen] = useLocalStorage<boolean>(SIDEBAR_WIDE_OPEN_KEY, true) as [
    boolean,
    (open: boolean) => void,
  ];
  const [railOpen, setRailOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    if (railOpen) setRailOpen(false);
  }

  return (
    <SidebarProvider
      open={isWide ? wideOpen : railOpen}
      onOpenChange={isWide ? setWideOpen : setRailOpen}
      data-focus-mode={focusActive || undefined}
    >
      <a
        href={`#${MAIN_ID}`}
        onClick={skipToMain}
        className="sr-only rounded-md bg-background px-4 py-2 text-sm font-medium text-foreground shadow-lg ring-2 ring-ring focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
      >
        Skip to main content
      </a>
      <SettingsProvider>
        <ChessSoundProvider>
          <ChallengesProvider>
            <AppSidebar />
            <StudyInviteToasts />
            <DuelInviteListener />
            <FriendUpdates />
            <BlockUpdates />
            <PushSync />
            <SidebarInset
              className={cn(
                onGamePage
                  ? "[--app-top-bar-height:2.5rem] md:[--app-top-bar-height:0px]"
                  : // From 768px: what md:pt-12 on <main> adds to its usual
                    // top padding (1.25rem, 2rem from 1024px)
                    "[--app-top-bar-height:3.5rem] md:[--app-top-bar-height:1.75rem] lg:[--app-top-bar-height:1rem]"
              )}
            >
              <MobileTopBar compact={onGamePage} />
              {!onGamePage && <CornerInbox />}
              <main
                id={MAIN_ID}
                tabIndex={-1}
                className={cn(
                  "mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 outline-none sm:px-6 lg:px-8 lg:py-8",
                  // Room for the bottom nav and the home indicator below it,
                  // and for the corner inbox above
                  !onGamePage &&
                    "pb-[calc(5rem+env(safe-area-inset-bottom))] md:pt-12 md:pb-8 lg:pt-12"
                )}
              >
                <ErrorBoundary scope="page" resetKey={pathname}>
                  <Suspense
                    fallback={<FullScreenLoader height="h-[calc(100svh-8rem)] w-full" />}
                  >
                    <Outlet />
                  </Suspense>
                </ErrorBoundary>
              </main>
              {!onGamePage && <MobileBottomNav />}
            </SidebarInset>
          </ChallengesProvider>
        </ChessSoundProvider>
      </SettingsProvider>
    </SidebarProvider>
  );
};
