import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** When this changes (e.g. the pathname) a caught error is cleared */
  resetKey?: unknown;
  /**
   * "page": fills the content area next to the sidebar; the rest of the app
   * keeps working. "app" (default): the whole screen, last line of defence.
   */
  scope?: "page" | "app";
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** A render error shows this instead of a white page. */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled render error", error, info.componentStack);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const isPage = this.props.scope === "page";

    return (
      <div
        role="alert"
        className={cn(
          "flex w-full flex-col items-center justify-center gap-4 p-6 text-center",
          isPage ? "min-h-[60vh]" : "min-h-svh"
        )}
      >
        <h1 className="font-display text-2xl text-foreground">
          Something went wrong
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {isPage
            ? "This page couldn't be shown. Reload it, or use the menu to go somewhere else."
            : "Reload the page to continue."}
        </p>
        <Button onClick={() => window.location.reload()}>Reload</Button>
      </div>
    );
  }
}
