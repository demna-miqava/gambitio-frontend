import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/hooks/useUser";
import {
  getNavItems,
  isNavItemActive,
  navItemLabel,
  SETTINGS_NAV_ITEM,
  type NavItem,
} from "@/config/sidebarItems";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/Brand";
import { SidebarUserMenu } from "./SidebarUserMenu";
import { ReturnToGameSidebarItem } from "@/components/active-game/ReturnToGame";
import { useNavBadges } from "@/components/navBadges";

// Same height and icon position (11px in, so an 18px icon sits in the middle
// of the 40px rail button) in both states, so collapsing and expanding only
// animate the width instead of making every item jump
const itemClass =
  "relative h-10 gap-3 pl-[11px] group-data-[collapsible=icon]:pl-[11px]! group-data-[collapsible=icon]:justify-start text-[0.925rem] text-sidebar-foreground/80 data-[active=true]:text-sidebar-accent-foreground [&>svg]:size-[18px] data-[active=true]:[&>svg]:text-primary";

/**
 * The phone sheet (only rendered below 768px) gets 44px rows and toggles so
 * they're easy to tap; the desktop sidebar keeps its 40px density.
 */
const mobileItemClass = "h-11 group-has-data-[sidebar=menu-action]/menu-item:pr-12";

/** Count bubble: beside the label in the full sidebar, on the icon in the rail. */
const NavBadge = ({ count }: { count?: number }) => {
  const { isMobile } = useSidebar();
  return count ? (
    <span
      aria-hidden="true"
      className={cn(
        "absolute top-1/2 right-10 flex h-5 min-w-5 -translate-y-1/2 items-center justify-center rounded-full bg-primary px-1.5 text-[0.7rem] font-semibold leading-none text-primary-foreground tabular-nums group-data-[collapsible=icon]:top-0.5 group-data-[collapsible=icon]:right-0.5 group-data-[collapsible=icon]:h-4 group-data-[collapsible=icon]:min-w-4 group-data-[collapsible=icon]:translate-y-0 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:text-[0.625rem]",
        // Clear of the wider expand toggle in the phone sheet
        isMobile && "right-12"
      )}
    >
      {count > 9 ? "9+" : count}
    </span>
  ) : null;
};

const NavLeaf = ({
  item,
  active,
  badge,
}: {
  item: NavItem;
  active: boolean;
  badge?: number;
}) => {
  const { setOpenMobile, isMobile } = useSidebar();
  return (
    <SidebarMenuButton
      asChild
      isActive={active}
      tooltip={navItemLabel(item.title, badge)}
      className={cn(itemClass, isMobile && mobileItemClass)}
    >
      <Link
        to={item.url}
        onClick={() => setOpenMobile(false)}
        aria-label={badge ? navItemLabel(item.title, badge) : undefined}
      >
        <item.icon />
        <NavBadge count={badge} />
        <span>{item.title}</span>
      </Link>
    </SidebarMenuButton>
  );
};

/** Icon-only rail: sub-pages open in a menu on click (works with keyboard and touch). */
const CollapsedGroup = ({
  item,
  active,
  badge,
}: {
  item: NavItem;
  active: boolean;
  badge?: number;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <SidebarMenuButton
        isActive={active}
        tooltip={navItemLabel(item.title, badge)}
        className={itemClass}
        aria-label={`${navItemLabel(item.title, badge)} menu`}
      >
        <item.icon />
        <NavBadge count={badge} />
        <span>{item.title}</span>
      </SidebarMenuButton>
    </DropdownMenuTrigger>
    <DropdownMenuContent side="right" align="start" className="w-52">
      <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
        {item.title}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      {item.items?.map((sub) => (
        <DropdownMenuItem key={sub.title} asChild>
          <Link to={sub.url} state={sub.state}>
            {sub.title}
          </Link>
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

const ExpandedGroup = ({
  item,
  active,
  pathname,
  badge,
}: {
  item: NavItem;
  active: boolean;
  pathname: string;
  badge?: number;
}) => {
  const { setOpenMobile, isMobile } = useSidebar();
  return (
    <Collapsible defaultOpen={active} className="group/collapsible">
      <NavLeaf item={item} active={active} badge={badge} />
      <CollapsibleTrigger asChild>
        {/* 32px in the desktop sidebar; a 44px square (the row's height) in
            the phone sheet */}
        <SidebarMenuAction
          className={cn(
            "top-0.5 right-0.5 w-8 text-sidebar-foreground/60 peer-data-[size=default]/menu-button:top-0.5 transition-transform duration-300 ease-disclosure group-data-[state=open]/collapsible:rotate-90",
            isMobile &&
              "top-0 right-0 w-11 after:hidden peer-data-[size=default]/menu-button:top-0"
          )}
          aria-label={`Show ${item.title} pages`}
        >
          <ChevronRight />
        </SidebarMenuAction>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub className="mt-0.5 mb-1">
          {item.items?.map((sub) => (
            <SidebarMenuSubItem key={sub.title}>
              <SidebarMenuSubButton
                asChild
                isActive={!sub.state && pathname === sub.url}
                className={cn(
                  "h-8 text-sidebar-foreground/70",
                  isMobile && "h-11"
                )}
              >
                <Link
                  to={sub.url}
                  state={sub.state}
                  onClick={() => setOpenMobile(false)}
                >
                  {sub.title}
                </Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
};

// Matches the sidebar's width transition (ui/sidebar.tsx)
const COLLAPSE_MS = 300;

/**
 * `collapsed`, but turning true only once the collapse animation is over.
 * Layout swaps that can't animate (logo → mark, the header stacking, groups
 * turning into menus) then happen when the rail is already narrow, instead
 * of snapping at the start while it's still wide. Expanding swaps at once,
 * so the full layout is revealed as the sidebar widens.
 */
const useSettledCollapsed = (collapsed: boolean) => {
  const [settled, setSettled] = useState(collapsed);
  useEffect(() => {
    if (!collapsed) {
      setSettled(false);
      return;
    }
    const timer = setTimeout(() => setSettled(true), COLLAPSE_MS);
    return () => clearTimeout(timer);
  }, [collapsed]);
  return collapsed && settled;
};

export function AppSidebar() {
  const { id } = useUser();
  const { pathname } = useLocation();
  const { state, isMobile } = useSidebar();
  const collapsedNow = state === "collapsed" && !isMobile;
  const isCollapsed = useSettledCollapsed(collapsedNow);
  const items = useMemo(() => getNavItems(id ?? 0), [id]);
  const badges = useNavBadges();

  return (
    <Sidebar collapsible="icon">
      {/*
        One row in both states, with the mark at the same spot (centred in the
        rail), so collapsing never makes the items below jump. In the rail
        the mark turns into the expand button on hover or keyboard focus, and
        is always the button on touch screens (no hover there).
      */}
      <SidebarHeader className="group/header relative overflow-hidden px-4 pt-4 pb-2">
        <div className="flex items-center justify-between gap-2">
          <Link
            to={ROUTES.HOME}
            aria-label="Gambitio home"
            className="min-w-0 overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <BrandLogo />
          </Link>
          {!isMobile && (
            <SidebarTrigger
              className={cn(
                "shrink-0 text-sidebar-foreground/60 hover:text-sidebar-foreground",
                isCollapsed &&
                  "absolute top-4 left-4 size-8 bg-sidebar opacity-0 transition-opacity group-hover/header:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
              )}
              aria-label={collapsedNow ? "Expand sidebar" : "Collapse sidebar"}
            />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1">
        <SidebarGroup className="pb-0 empty:hidden">
          <ReturnToGameSidebarItem />
        </SidebarGroup>

        <nav aria-label="Main" className="flex min-h-0 flex-1 flex-col gap-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => {
                const active = isNavItemActive(item, pathname);
                const badge = badges[item.title];
                return (
                  <SidebarMenuItem key={item.title}>
                    {!item.items ? (
                      <NavLeaf item={item} active={active} badge={badge} />
                    ) : isCollapsed ? (
                      <CollapsedGroup item={item} active={active} badge={badge} />
                    ) : (
                      <ExpandedGroup
                        item={item}
                        active={active}
                        pathname={pathname}
                        badge={badge}
                      />
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <NavLeaf
                  item={SETTINGS_NAV_ITEM}
                  active={isNavItemActive(SETTINGS_NAV_ITEM, pathname)}
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        </nav>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 group-data-[collapsible=icon]:px-3">
        <SidebarUserMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
