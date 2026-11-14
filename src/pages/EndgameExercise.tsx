import { Link, useParams } from "react-router-dom";
import { Crown } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getEndgameExercise } from "@/features/endgames/data/exercises";
import { ExerciseView } from "@/features/endgames/components/ExerciseView";

const ExerciseNotFound = () => {
  useDocumentTitle("Exercise not found");
  return (
    <PageContainer>
      <h1 className="sr-only">Exercise not found</h1>
      <EmptyState
        icon={Crown}
        title="This exercise doesn't exist"
        description="It may have been renamed. Pick one from the endgame lab."
        action={
          <Button size="lg" asChild>
            <Link to={ROUTES.ENDGAMES}>Open the endgame lab</Link>
          </Button>
        }
      />
    </PageContainer>
  );
};

/** One endgame exercise. A new exercise remounts the board and engine. */
const EndgameExercisePage = () => {
  const { exerciseId } = useParams();
  const exercise = getEndgameExercise(exerciseId);
  if (!exercise) return <ExerciseNotFound />;
  return <ExerciseView key={exercise.id} exercise={exercise} />;
};

export default EndgameExercisePage;
