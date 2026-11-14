import { Link } from "react-router-dom";
import { ChevronsUpDown, LogOut, Moon, Settings, Sun, UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { UserAvatar } from "@/components/UserAvatar";
import { useUser } from "@/hooks/useUser";
import { useTheme } from "@/context/ThemeContext";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { ROUTES, getProfileRoute } from "@/constants/routes";

/** Account controls (profile, settings, theme, sign out) behind the user's avatar. */
export function SidebarUserMenu() {
  const { id, username, image } = useUser();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useLogout();
  const { isMobile, setOpenMobile } = useSidebar();
  const closeMobile = () => setOpenMobile(false);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip="Account"
              className="gap-3 data-[state=open]:bg-sidebar-accent"
              aria-label="Account menu"
            >
              <UserAvatar src={image} username={username} className="size-8" />
              <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium">{username}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={isMobile ? "top" : "right"}
            align="end"
            sideOffset={8}
            className="w-56"
          >
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm font-medium">{username}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {id && (
              <DropdownMenuItem asChild>
                <Link to={getProfileRoute(id)} onClick={closeMobile}>
                  <UserRound /> Profile
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link to={ROUTES.SETTINGS} onClick={closeMobile}>
                <Settings /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(event) => {
                // Keep the menu open so the change is visible
                event.preventDefault();
                toggleTheme();
              }}
            >
              {theme === "dark" ? <Sun /> : <Moon />}
              {theme === "dark" ? "Light theme" : "Dark theme"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => logout()}>
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
