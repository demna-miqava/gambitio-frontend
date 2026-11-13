import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * The content width of every non-board page (Watch, Leaderboard, Profile,
 * Settings, ...): centred, at most 72rem (1152px). Wide enough for a main
 * column plus a 300px sidebar or three game cards in a row; long text inside
 * keeps its own measure (PageHeader caps descriptions at max-w-2xl).
 * AppLayout's <main> adds the page padding around it.
 */
export const PAGE_CONTAINER_CLASS = "mx-auto w-full max-w-6xl";

export const PageContainer = ({ className, ...props }: ComponentProps<"div">) => (
  <div className={cn(PAGE_CONTAINER_CLASS, className)} {...props} />
);
