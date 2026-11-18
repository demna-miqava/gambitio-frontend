import { Link } from "react-router-dom";
import { getConversionDrillRoute } from "@/constants/routes";
import { MiniBoard } from "@/features/endgames/components/MiniBoard";
import { cn } from "@/lib/utils";
import type { ConversionDrill } from "../types";
import { formatDrillEval } from "../utils/findDrill";
import { describeOrigin, moveNumberLabel, reviewLabel } from "../utils/describe";
import { isDue } from "../hooks/useConversionDrills";

/** One drill: the position, where it came from and when it's due. */
export const DrillCard = ({ drill }: { drill: ConversionDrill }) => {
  const due = isDue(drill);
  return (
    <Link
      to={getConversionDrillRoute(drill.id)}
      className="group flex gap-3 rounded-xl bg-card p-3 transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <MiniBoard fen={drill.fen} orientation={drill.color} className="w-24 shrink-0 sm:w-28" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h3 className="font-display leading-tight text-foreground">
          {moveNumberLabel(drill.ply)}, you were{" "}
          <span className="tabular-nums">{formatDrillEval(drill.eval)}</span>
        </h3>
        <p className="truncate text-sm text-muted-foreground">{describeOrigin(drill)}</p>
        <p className={cn("mt-auto text-xs tabular-nums", due ? "font-medium text-primary" : "text-muted-foreground")}>
          {reviewLabel(drill)}
        </p>
      </div>
    </Link>
  );
};
