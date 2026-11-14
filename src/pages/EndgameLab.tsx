import { Link } from "react-router-dom";
import { ArrowRight, RotateCcw, Trophy } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader, SectionHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getEndgameExerciseRoute } from "@/constants/routes";
import { ENDGAME_CATEGORIES, ENDGAME_EXERCISES } from "@/features/endgames/data/exercises";
import { useEndgameProgress } from "@/features/endgames/hooks/useEndgameProgress";
import { ExerciseCard } from "@/features/endgames/components/ExerciseCard";

/** Guided endgame positions, grouped by theme, with the player's progress. */
const EndgameLab = () => {
  useDocumentTitle("Endgame lab");
  const { byId, isPending, isError, refetch, isFetching } = useEndgameProgress();

  const total = ENDGAME_EXERCISES.length;
  const completed = ENDGAME_EXERCISES.filter((e) => byId.get(e.id)?.completedAt).length;
  const nextUp = ENDGAME_EXERCISES.find((e) => !byId.get(e.id)?.completedAt);
  const started = ENDGAME_EXERCISES.some((e) => byId.has(e.id));
  const percent = Math.round((completed / total) * 100);

  return (
    <PageContainer className="space-y-8">
      <PageHeader
        eyebrow="Training"
        title="Endgame lab"
        description="Guided endgame positions against the engine at full strength. Each one has a clear goal, and you can retry as often as you like."
        actions={
          nextUp && !isPending ? (
            <Button size="lg" asChild>
              <Link to={getEndgameExerciseRoute(nextUp.id)}>
                {started ? "Continue" : "Start"} <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          ) : undefined
        }
      />

      <section
        aria-label="Your progress"
        className="flex flex-col gap-3 rounded-2xl bg-card p-5 sm:flex-row sm:items-center sm:gap-6"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-primary">
          <Trophy className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          {isPending ? (
            <Skeleton className="h-5 w-48" />
          ) : isError ? (
            <p className="text-sm text-muted-foreground">
              Couldn't load your progress.{" "}
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RotateCcw aria-hidden="true" /> Try again
              </Button>
            </p>
          ) : (
            <p className="text-sm font-medium text-foreground">
              <span className="tabular-nums">
                {completed} of {total}
              </span>{" "}
              exercises completed
              {completed === total && " — every one of them. Well played!"}
            </p>
          )}
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="Exercises completed"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={isPending || isError ? undefined : completed}
          >
            <div
              className="h-full rounded-full bg-win transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${isPending || isError ? 0 : percent}%` }}
            />
          </div>
        </div>
      </section>

      {ENDGAME_CATEGORIES.map((category) => {
        const exercises = ENDGAME_EXERCISES.filter((e) => e.category === category.name);
        const done = exercises.filter((e) => byId.get(e.id)?.completedAt).length;
        const headingId = `endgames-${category.name.toLowerCase().replace(/\s+/g, "-")}`;
        return (
          <section key={category.name} className="space-y-3" aria-labelledby={headingId}>
            <div className="space-y-0.5">
              <SectionHeader
                title={<span id={headingId}>{category.name}</span>}
                action={
                  !isPending && !isError ? (
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {done}/{exercises.length}
                    </span>
                  ) : undefined
                }
              />
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {exercises.map((exercise) => (
                <li key={exercise.id}>
                  <ExerciseCard
                    exercise={exercise}
                    progress={byId.get(exercise.id)}
                    progressPending={isPending}
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </PageContainer>
  );
};

export default EndgameLab;
