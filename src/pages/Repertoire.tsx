import { useSearchParams } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useRepertoire } from "@/features/repertoire/hooks/useRepertoire";
import { RepertoireNav } from "@/features/repertoire/components/RepertoireNav";
import { LinesView } from "@/features/repertoire/components/LinesView";
import { PracticeView } from "@/features/repertoire/components/PracticeView";
import { GamesView } from "@/features/repertoire/components/GamesView";
import { parseColor, parseView } from "@/features/repertoire/utils/view";

const TITLES = { lines: "Opening repertoire", practice: "Repertoire practice", games: "Repertoire check" };

/** The player's opening repertoire: their lines, practice, and how games follow them. */
const Repertoire = () => {
  const [params, setParams] = useSearchParams();
  const view = parseView(params.get("view"));
  const color = parseColor(params.get("color"));
  const lineParam = Number(params.get("line"));
  const startLineId = Number.isInteger(lineParam) && lineParam > 0 ? lineParam : null;
  const { data: lines, isPending, isError, refetch, isFetching } = useRepertoire();
  useDocumentTitle(TITLES[view]);

  const status = isPending ? (
    <div className="space-y-3" aria-busy="true" aria-label="Loading your repertoire">
      <Skeleton className="h-20 rounded-2xl" />
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
    </div>
  ) : isError ? (
    <EmptyState
      icon={BookOpen}
      title="Couldn't load your repertoire"
      description="Check your connection and try again."
      action={
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          Try again
        </Button>
      }
    />
  ) : null;

  // Practice is a board page; the nav sits in its panel
  if (view === "practice" && lines) {
    return (
      <>
        <h1 className="sr-only">{TITLES.practice}</h1>
        <RepertoireNav current="practice" className="mb-4 lg:hidden" />
        <PracticeView
          lines={lines}
          startLineId={startLineId}
          onLineChange={(id) => setParams({ view: "practice", line: String(id) }, { replace: true })}
        />
      </>
    );
  }

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Opening repertoire"
        description="Keep the lines you prepare, drill them until they stick, and see where your games leave them."
      />
      <RepertoireNav current={view} />
      {status ??
        (lines &&
          (view === "games" ? (
            <GamesView hasLines={lines.length > 0} />
          ) : (
            <LinesView
              lines={lines}
              color={color}
              onColorChange={(next) =>
                setParams(next === "white" ? {} : { color: next }, { replace: true })
              }
            />
          )))}
    </PageContainer>
  );
};

export default Repertoire;
