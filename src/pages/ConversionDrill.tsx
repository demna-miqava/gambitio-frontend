import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Target } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { QKEY_CONVERSION_DRILLS } from "@/constants/queryKeys";
import { parsePositiveId } from "@/utils/ids";
import { getConversionDrill } from "@/services/conversionDrills";
import { DrillView } from "@/features/conversion-drills/components/DrillView";

/** One conversion drill. Another drill remounts the board and engine. */
const ConversionDrillPage = () => {
  const drillId = parsePositiveId(useParams().drillId);
  const { data: drill, isPending, error, refetch } = useQuery({
    queryKey: [QKEY_CONVERSION_DRILLS, drillId],
    queryFn: () => getConversionDrill(drillId!),
    enabled: drillId !== null,
    staleTime: Infinity,
  });

  if (drillId !== null && isPending) return <FullScreenLoader height="h-[60vh] w-full" />;
  if (!drill) {
    const missing = drillId === null || (isAxiosError(error) && error.response?.status === 404);
    return (
      <PageContainer>
        <EmptyState
          icon={Target}
          title={missing ? "This drill doesn't exist" : "Couldn't load this drill"}
          description={missing ? "It may have been removed." : "Check your connection and try again."}
          action={
            missing ? (
              <Button size="lg" asChild>
                <Link to={ROUTES.CONVERSION_DRILLS}>All drills</Link>
              </Button>
            ) : (
              <Button size="lg" onClick={() => refetch()}>
                Retry
              </Button>
            )
          }
        />
      </PageContainer>
    );
  }
  return <DrillView key={drill.id} drill={drill} />;
};

export default ConversionDrillPage;
