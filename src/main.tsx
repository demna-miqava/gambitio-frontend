import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.tsx";
import { ThemeProvider } from "@/context/ThemeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/sonner.tsx";
import { FIVE_MINUTES_MS } from "@/constants/time";
import { ClerkProviderWithRoutes } from "./components/ClerkProviderWithRoutes";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThemeColorMeta } from "./components/ThemeColorMeta";
import { reloadOnStaleChunks } from "./utils/reloadOnStaleChunks";

reloadOnStaleChunks();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: FIVE_MINUTES_MS,
      refetchOnWindowFocus: false,
    },
  },
});

// A data router (rather than <BrowserRouter>) so pages can use useBlocker,
// e.g. to confirm before leaving a game in progress. The app's own <Routes>
// still do the matching inside this single catch-all route.
const router = createBrowserRouter([
  {
    path: "*",
    // Our boundary sits inside the route so a crash in the shell (Clerk,
    // AuthGuard, sidebar, providers) shows the app's error screen rather than
    // React Router's developer one
    element: (
      <ErrorBoundary>
        <ClerkProviderWithRoutes>
          <App />
          <Toaster />
        </ClerkProviderWithRoutes>
      </ErrorBoundary>
    ),
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Last resort; each page also has its own boundary inside AppLayout */}
    <ErrorBoundary>
      <ThemeProvider>
        <ThemeColorMeta />
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
