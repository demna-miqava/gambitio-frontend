import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { BrandMark } from "./Brand";

/** How long the logo pulses on its own before the text appears */
export const SLOW_LOADING_DELAY_MS = 2000;

interface FullScreenLoaderProps {
  /** Size classes. Defaults to the whole viewport (h-svh w-full) */
  height?: string;
  /**
   * Shown under the logo once loading has taken longer than
   * SLOW_LOADING_DELAY_MS, so a slow start doesn't look like a frozen page
   */
  slowMessage?: string;
}

export const FullScreenLoader = ({
  height = "h-svh w-full",
  slowMessage = "Still loading…",
}: FullScreenLoaderProps) => {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsSlow(true), SLOW_LOADING_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-4", height)}
      role="status"
    >
      <BrandMark className="size-10 animate-pulse" />
      {/* Always rendered so the logo doesn't jump when the text appears */}
      <p
        className={cn(
          "min-h-5 text-sm text-muted-foreground transition-opacity duration-300",
          isSlow ? "opacity-100" : "opacity-0"
        )}
      >
        {isSlow ? slowMessage : <span className="sr-only">Loading</span>}
      </p>
    </div>
  );
};
