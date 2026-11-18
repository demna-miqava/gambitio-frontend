import { apiRequest } from ".";
import type { StartingOpening } from "@/features/openings/startingOpenings";

/** The openings a friend challenge (or mirror match) can start from */
export const getStartingOpenings = async (): Promise<StartingOpening[]> =>
  (await apiRequest<{ openings: StartingOpening[] }>("get", "/openings")).openings;
