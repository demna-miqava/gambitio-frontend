import { apiRequest } from ".";
import type {
  CoordinateRunResult,
  CoordinateScores,
  RecordedCoordinateRun,
} from "@/features/coordinates/types";

/** The signed-in player's coordinates bests and latest runs. */
export const getCoordinateScores = () => apiRequest<CoordinateScores>("get", "/coordinates/scores");

/** Records a finished run; the answer says the best before it. */
export const recordCoordinateRun = (run: CoordinateRunResult) =>
  apiRequest<RecordedCoordinateRun>("post", "/coordinates/runs", { data: run });
