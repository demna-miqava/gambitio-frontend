import { Outlet, useLocation } from "react-router-dom";
import { Suspense, useEffect, useState, type MouseEvent } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
 * `--app-top-bar-height` tells pages how much of the viewport the sticky top
 * bar takes (0px when there is none), e.g. for the board's height cap.
 */
export const AppLayout = () => {
  const { pathname } = useLocation();
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
            <FriendUpdates />
            <SidebarInset
              className={cn(
                "md:[--app-top-bar-height:0px]",
                onGamePage
                  ? "[--app-top-bar-height:2.5rem]"
                  : "[--app-top-bar-height:3.5rem]"
              )}
            >
              <MobileTopBar compact={onGamePage} />
              <main
                id={MAIN_ID}
                tabIndex={-1}
                className={cn(
                  "mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 outline-none sm:px-6 lg:px-8 lg:py-8",
                  // Room for the bottom nav and the home indicator below it
                  !onGamePage && "pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-8"
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
