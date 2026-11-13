import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { getBottomNavItems, isNavItemActive, navItemLabel } from "@/config/sidebarItems";
import { useNavBadges } from "@/components/navBadges";

/** Phone navigation: the five main destinations, always one tap away. */
export const MobileBottomNav = () => {
  const { id } = useUser();
  const { pathname } = useLocation();
  const items = useMemo(() => getBottomNavItems(id ?? 0), [id]);
  const badges = useNavBadges();

  return (
    <nav
      aria-label="Main"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 md:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-5">
        {items.map((item) => {
          const active = isNavItemActive(item, pathname);
          const badge = badges[item.title];
          return (
            <li key={item.title}>
              <Link
                to={item.url}
                aria-current={active ? "page" : undefined}
                aria-label={badge ? navItemLabel(item.title, badge) : undefined}
                className={cn(
                  "group/nav flex h-full flex-col items-center justify-center gap-1 text-xs font-medium transition-colors outline-none focus-visible:text-foreground",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "relative flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                    // The pill gives tap feedback (there's no hover on phones)
                    // and shows keyboard focus
                    "group-focus-visible/nav:ring-2 group-focus-visible/nav:ring-ring",
                    active ? "bg-brand-soft" : "group-active/nav:bg-active-bg"
                  )}
                >
                  <item.icon className="size-5" aria-hidden="true" />
                  {badge ? (
                    <span
                      aria-hidden="true"
                      className="absolute -top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] font-semibold leading-none text-primary-foreground tabular-nums ring-2 ring-background"
                    >
                      {badge > 9 ? "9+" : badge}
                    </span>
                  ) : null}
                </span>
                {item.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
