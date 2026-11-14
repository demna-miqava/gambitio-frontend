import { apiRequest } from ".";
import type { HeadToHead, SeriesDetail, SeriesSummary } from "@/features/series/types";

export const getSeries = (seriesId: number) =>
  apiRequest<SeriesDetail>("get", `/series/${seriesId}`);

/** Gives the series to the opponent (only between games). */
export const resignSeries = async (seriesId: number): Promise<SeriesSummary> =>
  (await apiRequest<{ series: SeriesSummary }>("post", `/series/${seriesId}/resign`)).series;

/** A player's series, newest first. */
export const getUserSeries = async (userId: number, limit = 10): Promise<SeriesSummary[]> =>
  (await apiRequest<{ data: SeriesSummary[] }>("get", `/users/${userId}/series?limit=${limit}`)).data;

/** The signed-in player's record against another player. */
export const getHeadToHead = (userId: number) =>
  apiRequest<HeadToHead>("get", `/users/${userId}/head-to-head`);
