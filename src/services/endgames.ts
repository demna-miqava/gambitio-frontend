import { apiRequest } from ".";
import type { EndgameProgress } from "@/features/endgames/types";

/** The signed-in player's progress on every exercise they've tried. */
export const getEndgameProgress = async (): Promise<EndgameProgress[]> => {
  const response = await apiRequest<{ progress: EndgameProgress[] }>("get", "/endgames/progress");
  return response.progress;
};

/** Records a finished attempt. `moves` counts the player's own moves. */
export const recordEndgameAttempt = async (
  exerciseId: string,
  body: { success: boolean; moves: number }
): Promise<EndgameProgress> => {
  const response = await apiRequest<{ progress: EndgameProgress }>(
    "post",
    `/endgames/${encodeURIComponent(exerciseId)}/attempts`,
    { data: body }
  );
  return response.progress;
};
