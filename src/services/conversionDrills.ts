import { apiRequest } from ".";
import type { ConversionDrill, DrillEval, ScanCandidate } from "@/features/conversion-drills/types";

/** The signed-in player's drills, due ones first */
export const getConversionDrills = async (): Promise<ConversionDrill[]> =>
  (await apiRequest<{ drills: ConversionDrill[] }>("get", "/conversion-drills")).drills;

/** Their most recent games that they didn't win and haven't been scanned yet */
export const getScanCandidates = async (limit = 10): Promise<ScanCandidate[]> =>
  (await apiRequest<{ games: ScanCandidate[] }>("get", `/conversion-drills/candidates?limit=${limit}`)).games;

/** Records a scanned game and the position found in it (null: none). Returns the new drill, if any */
export const recordDrillScan = async (
  gameId: number,
  drill: { ply: number; eval: DrillEval } | null
): Promise<ConversionDrill | null> =>
  (await apiRequest<{ drill: ConversionDrill | null }>("post", "/conversion-drills/scans", { data: { gameId, drill } }))
    .drill;

/** Records a finished attempt; the server schedules the next review. `moves` counts the player's own moves */
export const recordDrillAttempt = async (
  drillId: number,
  body: { success: boolean; moves: number }
): Promise<ConversionDrill> =>
  (await apiRequest<{ drill: ConversionDrill }>("post", `/conversion-drills/${drillId}/attempts`, { data: body }))
    .drill;

export const deleteConversionDrill = (drillId: number) =>
  apiRequest<void>("delete", `/conversion-drills/${drillId}`);

export const getConversionDrill = async (drillId: number): Promise<ConversionDrill> =>
  (await apiRequest<{ drill: ConversionDrill }>("get", `/conversion-drills/${drillId}`)).drill;
