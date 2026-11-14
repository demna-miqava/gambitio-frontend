import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "@/hooks/useUser";
import { FullScreenLoader } from "./FullScreenLoader";
import { ROUTES } from "@/constants/routes";
import { Button } from "./ui/button";
import { REDIRECT_PARAM, getSafeRedirect, withRedirect } from "@/routes/redirect";

const publicRoutes: string[] = [
  ROUTES.LANDING,
  ROUTES.AUTH.SIGN_IN,
  ROUTES.AUTH.SIGN_UP,
];

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isPublicRoute = publicRoutes.includes(location.pathname);
  const isProfileSetupRoute = location.pathname === ROUTES.AUTH.PROFILE_SETUP;
  const { isPending, isAuthenticated, hasProfile, isError, refetch } = useUser();

  if (isPending) {
    // Waiting on Clerk and the profile status call; with the API down this
    // turns into the error below after ~1-2s (useUser retries once)
    return <FullScreenLoader slowMessage="Connecting to Gambitio…" />;
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="flex min-h-svh w-full flex-col items-center justify-center gap-4 p-6 text-center"
      >
        <h1 className="font-display text-2xl text-foreground">
          Can't reach Gambitio
        </h1>
        <p className="text-sm text-muted-foreground">
          Check your connection and try again.
        </p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  // User is authenticated via Clerk
  if (isAuthenticated) {
    // User doesn't have a chess profile yet
    if (!hasProfile) {
      // Already on profile setup page, allow
      if (isProfileSetupRoute) {
        return <>{children}</>;
      }
      // Redirect to profile setup
      // (keeping where they were headed, e.g. a game link)
      const destination =
        new URLSearchParams(location.search).get(REDIRECT_PARAM) ??
        `${location.pathname}${location.search}${location.hash}`;
      return <Navigate to={withRedirect(ROUTES.AUTH.PROFILE_SETUP, destination)} replace />;
    }

    // User has profile - redirect away from public routes and profile setup,
    // to the page they were sent to sign in from (if it's one of ours)
    if (isPublicRoute || isProfileSetupRoute) {
      const destination = new URLSearchParams(location.search).get(REDIRECT_PARAM);
      return <Navigate to={getSafeRedirect(destination)} replace />;
    }
  } else {
    // User is not authenticated
    // Allow public routes
    if (isPublicRoute) {
      return <>{children}</>;
    }
    // Redirect unauthenticated users to sign in, then back to this page
    const here = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={withRedirect(ROUTES.AUTH.SIGN_IN, here)} replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
