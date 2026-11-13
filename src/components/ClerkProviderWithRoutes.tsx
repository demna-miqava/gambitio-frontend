import { useEffect, useRef, type ComponentProps } from "react";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { setAuthTokenGetter } from "@/services";
import { QKEY_PROFILE_STATUS } from "@/constants/queryKeys";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

type ClerkAppearance = ComponentProps<typeof ClerkProvider>["appearance"];

/** Same corner radius as the app's buttons and inputs (rounded-md) */
const CONTROL_RADIUS = "calc(var(--radius) - 2px)";
/** 44px: comfortable to tap on phones (the app's lg button size) */
const CONTROL_HEIGHT = "2.75rem";
const FOCUS_RING =
  "0 0 0 3px color-mix(in oklch, var(--ring) 50%, transparent)";

/**
 * Clerk's sign-in/up and account widgets use the app's design tokens, so they
 * follow the accent color and light/dark theme automatically.
 *
 * Element overrides are style objects rather than Tailwind classes: Clerk's
 * own styles aren't in a CSS layer, so they would win over Tailwind's
 * utilities. The objects flatten Clerk's default look (gradient button,
 * shadow borders) to match the app's Button and Input.
 */
const CLERK_APPEARANCE: ClerkAppearance = {
  variables: {
    colorPrimary: "var(--primary)",
    colorPrimaryForeground: "var(--primary-foreground)",
    colorBackground: "var(--card)",
    colorForeground: "var(--foreground)",
    colorMutedForeground: "var(--muted-foreground)",
    colorMuted: "var(--muted)",
    colorInput: "var(--background)",
    colorInputForeground: "var(--foreground)",
    colorNeutral: "var(--foreground)",
    colorBorder: "var(--border)",
    colorRing: "var(--ring)",
    colorDanger: "var(--destructive)",
    colorSuccess: "var(--success)",
    // A plain length (Clerk derives its radius scale from it); 10px, the
    // same as CONTROL_RADIUS
    borderRadius: "0.625rem",
    fontFamily: "var(--font-sans)",
    fontFamilyButtons: "var(--font-sans)",
    fontSize: "0.875rem",
  },
  elements: {
    cardBox: {
      borderRadius: "1rem",
      border: "1px solid color-mix(in oklch, var(--border) 70%, transparent)",
      boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)",
    },
    card: { boxShadow: "none" },
    footer: { background: "var(--muted)" },
    headerTitle: {
      fontFamily: "var(--font-display)",
      fontSize: "1.5rem",
      fontWeight: 600,
      letterSpacing: "-0.015em",
    },
    formFieldInput: {
      minHeight: CONTROL_HEIGHT,
      borderRadius: CONTROL_RADIUS,
      border: "1px solid var(--input)",
      boxShadow: "none",
      // 16px, so iOS doesn't zoom the page when the field is focused
      fontSize: "1rem",
      "&:focus": { borderColor: "var(--ring)", boxShadow: FOCUS_RING },
      "&:hover": { borderColor: "var(--input)" },
    },
    formButtonPrimary: {
      minHeight: CONTROL_HEIGHT,
      borderRadius: CONTROL_RADIUS,
      backgroundColor: "var(--primary)",
      backgroundImage: "none",
      color: "var(--primary-foreground)",
      border: "none",
      boxShadow: "none",
      fontSize: "0.875rem",
      fontWeight: 500,
      textTransform: "none",
      // Clerk paints its gradient sheen on ::after
      "&::after": { display: "none" },
      "&:hover": {
        backgroundColor: "color-mix(in oklch, var(--primary) 90%, transparent)",
      },
      "&:active": {
        backgroundColor: "color-mix(in oklch, var(--primary) 80%, transparent)",
      },
      "&:focus": { boxShadow: FOCUS_RING },
    },
    socialButtonsBlockButton: {
      minHeight: CONTROL_HEIGHT,
      borderRadius: CONTROL_RADIUS,
      border: "1px solid var(--border)",
      boxShadow: "none",
      "&:hover": { backgroundColor: "var(--accent)" },
    },
    socialButtonsIconButton: {
      minHeight: CONTROL_HEIGHT,
      borderRadius: CONTROL_RADIUS,
      border: "1px solid var(--border)",
      boxShadow: "none",
    },
    otpCodeFieldInput: {
      minHeight: CONTROL_HEIGHT,
      borderRadius: CONTROL_RADIUS,
    },
    footerActionLink: {
      color: "var(--primary)",
      fontWeight: 500,
    },
  },
};

/**
 * Cached data belongs to the account that loaded it. When the signed-in
 * account changes (sign-out here or in another tab, an expired session,
 * another account signing in) drop all of it, except the new account's own
 * profile status, which may already be loading.
 */
const ResetCacheOnUserChange = () => {
  const { isLoaded, userId } = useAuth();
  const queryClient = useQueryClient();
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    const current = userId ?? null;
    const previous = previousUserId.current;
    previousUserId.current = current;
    if (previous === null || previous === current) return;
    queryClient.removeQueries({
      predicate: ({ queryKey }) =>
        !(queryKey[0] === QKEY_PROFILE_STATUS && queryKey[1] === current),
    });
  }, [isLoaded, userId, queryClient]);

  return null;
};

/** Gives the API client access to Clerk's session token. */
const AuthTokenBridge = ({ children }: { children: React.ReactNode }) => {
  const { getToken } = useAuth();
  // Set during render (not in an effect) so it's ready before children fetch
  setAuthTokenGetter(getToken);
  return (
    <>
      <ResetCacheOnUserChange />
      {children}
    </>
  );
};

export const ClerkProviderWithRoutes = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      appearance={CLERK_APPEARANCE}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
    >
      <AuthTokenBridge>{children}</AuthTokenBridge>
    </ClerkProvider>
  );
};
