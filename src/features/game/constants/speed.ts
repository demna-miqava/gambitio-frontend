import { Flame, Timer, Zap, type LucideIcon } from "lucide-react";
import type { TimeControlType } from "@/types";

/** The three pools a clock falls into, fastest first */
export const SPEEDS: TimeControlType[] = ["bullet", "blitz", "rapid"];

export const SPEED_LABEL: Record<TimeControlType, string> = {
  bullet: "Bullet",
  blitz: "Blitz",
  rapid: "Rapid",
};

export const SPEED_ICON: Record<TimeControlType, LucideIcon> = {
  bullet: Zap,
  blitz: Flame,
  rapid: Timer,
};
