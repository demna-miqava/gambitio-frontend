import { useCallback, useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { getUserGames } from "@/services/game";
import { useQueryParams } from "@/hooks/useQueryParams";
import { QKEY_USER_GAMES } from "@/constants/queryKeys";
import { useProfileUserId } from "@/hooks/useProfileUserId";
import {
  countActiveFilters,
  historyFiltersToApi,
  parseHistoryFilters,
  withFilter,
  withoutFilters,
  type HistoryFilterKey,
  type HistoryFilters,
} from "../utils/historyFilters";

interface UseUserGamesOptions {
  defaultPage?: number;
  defaultLimit?: number;
  /** Read filters from the URL (the full history only; previews never filter) */
  filterable?: boolean;
  /**
   * Ask for each game's moves too (a page of up to 20): Home's recent games
   * name the opening from them. Part of the request, so every caller that
   * shares the cached page must ask the same way
   */
  withMoves?: boolean;
}

const NO_FILTERS: HistoryFilters = {};

export const useUserGames = ({
  defaultPage = 1,
  defaultLimit = 10,
  filterable = false,
  withMoves = false,
}: UseUserGamesOptions = {}) => {
  const userId = useProfileUserId();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pageStr, setPageStr] = useQueryParams("page", String(defaultPage));
  const [limitStr] = useQueryParams("limit", String(defaultLimit));

  const page = parseInt(pageStr) || defaultPage;
  const limit = parseInt(limitStr) || defaultLimit;

  const filterKey = filterable ? searchParams.toString() : "";
  const filters = useMemo(
    () => (filterable ? parseHistoryFilters(new URLSearchParams(filterKey)) : NO_FILTERS),
    [filterable, filterKey]
  );
  const apiFilters = useMemo(
    () => ({ ...historyFiltersToApi(filters), ...(withMoves && { moves: "true" }) }),
    [filters, withMoves]
  );

  const query = useQuery({
    queryKey: [QKEY_USER_GAMES, userId, page, limit, apiFilters],
    queryFn: () => getUserGames({ userId: userId || 0, page, limit, filters: apiFilters }),
    enabled: !!userId,
    // Keep the rows on screen while a new filter or page loads
    placeholderData: filterable ? keepPreviousData : undefined,
  });

  const setPage = (newPage: number) => {
    setPageStr(String(newPage));
  };

  // Each change is a new history entry, so Back undoes it
  const setFilter = useCallback(
    (key: HistoryFilterKey, value: string | undefined) =>
      setSearchParams((current) => withFilter(current, key, value)),
    [setSearchParams]
  );
  const clearFilters = useCallback(
    () => setSearchParams((current) => withoutFilters(current)),
    [setSearchParams]
  );

  return {
    ...query,
    page,
    limit,
    setPage,
    pagination: query.data?.pagination,
    games: query.data?.data || [],
    filters,
    activeFilters: countActiveFilters(filters),
    setFilter,
    clearFilters,
  };
};
