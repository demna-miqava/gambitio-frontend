import { Link } from "react-router-dom";
import { ArrowRight, RotateCcw, Target } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getConversionDrillRoute } from "@/constants/routes";
import { isDue, useConversionDrills } from "@/features/conversion-drills/hooks/useConversionDrills";
import { useDrillScan } from "@/features/conversion-drills/hooks/useDrillScan";
import { DrillCard } from "@/features/conversion-drills/components/DrillCard";
import { ScanPanel } from "@/features/conversion-drills/components/ScanPanel";
import type { ConversionDrill } from "@/features/conversion-drills/types";

const DrillGrid = ({ drills }: { drills: ConversionDrill[] }) => (
  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {drills.map((drill) => (
      <li key={drill.id}>
        <DrillCard drill={drill} />
      </li>
    ))}
  </ul>
);

/**
 * Conversion drills: positions from the player's own games where they were
 * clearly winning and didn't win, to replay against Stockfish at full
 * strength. Technique, where puzzles train tactics.
 */
const ConversionDrills = () => {
  useDocumentTitle("Conversion drills");
  const { data: drills, isPending, isError, refetch, isFetching } = useConversionDrills();
  const scan = useDrillScan();
  const now = Date.now();
  const due = drills?.filter((d) => isDue(d, now)) ?? [];
  const later = drills?.filter((d) => !isDue(d, now)) ?? [];

  return (
    <PageContainer className="space-y-8">
      <PageHeader
        eyebrow="Training"
        title="Conversion drills"
        description="Positions from your own games where you were clearly winning and didn't win. Play them again against Stockfish at full strength until the technique sticks."
        actions={
          due[0] ? (
            <Button size="lg" asChild>
              <Link to={getConversionDrillRoute(due[0].id)}>
                Start <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          ) : undefined
        }
      />

      <ScanPanel state={scan.state} onStart={() => void scan.start()} onCancel={scan.cancel} />

      {isPending ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">
          Couldn't load your drills.{" "}
          <Button variant="link" size="sm" className="h-auto p-0" onClick={() => refetch()} disabled={isFetching}>
            <RotateCcw aria-hidden="true" /> Try again
          </Button>
        </p>
      ) : drills.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No drills yet"
          description="Scan your recent games to find the wins that got away. Only draws and losses are looked at."
        />
      ) : (
        <>
          <section className="space-y-3" aria-labelledby="drills-due">
            <SectionHeader
              title={<span id="drills-due">Due now</span>}
              action={<span className="text-xs tabular-nums text-muted-foreground">{due.length}</span>}
            />
            {due.length > 0 ? (
              <DrillGrid drills={due} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Nothing due. Converted drills come back after a day, then three, then a week.
              </p>
            )}
          </section>
          {later.length > 0 && (
            <section className="space-y-3" aria-labelledby="drills-later">
              <SectionHeader
                title={<span id="drills-later">Coming back later</span>}
                action={<span className="text-xs tabular-nums text-muted-foreground">{later.length}</span>}
              />
              <DrillGrid drills={later} />
            </section>
          )}
        </>
      )}
    </PageContainer>
  );
};

export default ConversionDrills;
