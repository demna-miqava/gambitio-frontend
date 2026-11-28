import { useMemo, type ComponentProps } from "react";
import { Link } from "react-router-dom";
import { SearchX, Swords } from "lucide-react";
import { createColumns } from "./Columns";
import { useUserGames } from "./hooks/useUserGames";
import { DataTable } from "./DataTable";
import { GameList } from "./components/GameList";
import { HistoryFilters } from "./components/HistoryFilters";
import { useProfileUserId } from "@/hooks/useProfileUserId";
import { useUser } from "@/hooks/useUser";
import { SectionHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/Pagination";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { useUserProfile } from "@/features/profile/hooks/useUserProfile";

type GameTableVariant = "preview" | "full";

/** The filters, with the profile owner's name (results and colours are theirs) */
const ProfileHistoryFilters = ({
  ownProfile,
  ...props
}: Omit<ComponentProps<typeof HistoryFilters>, "ownerName"> & { ownProfile: boolean }) => {
  const { profile } = useUserProfile();
  return <HistoryFilters {...props} ownerName={ownProfile ? undefined : profile?.username} />;
};

export type GameTableProps = {
  variant?: GameTableVariant;
  title?: string;
  actionHref?: string;
  limit?: number;
  /**
   * Home's recent games: a larger heading with an accent "View all" link,
   * and a "Review" link at the end of each row (preview variant only)
   */
  review?: boolean;
  /**
   * Show at most this many of the fetched games (preview only). Home sets it
   * to what fits on screen; `limit` is still what is fetched.
   */
  maxRows?: number;
};

export const GameTable = ({
  variant = "full",
  title = "Recent games",
  actionHref,
  limit = 10,
  review = false,
  maxRows,
}: GameTableProps) => {
  const isPreview = variant === "preview";
  const userId = useProfileUserId();
  const { id: currentUserId } = useUser();
  const isOwnProfile = userId === currentUserId;

  const {
    games,
    data,
    isPending,
    isPlaceholderData,
    page,
    setPage,
    pagination,
    filters,
    activeFilters,
    setFilter,
    clearFilters,
  } = useUserGames({
    defaultLimit: limit,
    filterable: !isPreview,
  });
  const filtered = activeFilters > 0;
  const rows = isPreview && maxRows !== undefined ? Math.min(maxRows, limit) : limit;
  const shown = rows < limit ? games.slice(0, rows) : games;

  const columns = useMemo(() => createColumns(userId, { review: isPreview && review }), [userId, isPreview, review]);

  const paginationProps = useMemo(() => {
    const totalPages = pagination?.totalPages ?? 1;
    return {
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }, [page, pagination?.totalPages]);

  const showLoading = isPending && games.length === 0;

  const filteredEmptyState = (
    <EmptyState
      variant="plain"
      icon={SearchX}
      title={
        data?.opponent === null && filters.opponent
          ? `No player is called “${filters.opponent}”`
          : "No games match these filters"
      }
      description="Change or clear the filters to see more games."
      action={
        <Button size="lg" variant="outline" className="md:h-8 md:gap-1.5 md:px-3" onClick={clearFilters}>
          Clear filters
        </Button>
      }
    />
  );
  const emptyState = filtered ? filteredEmptyState : (
    <EmptyState
      variant="plain"
      icon={Swords}
      title="No games yet"
      description={
        isOwnProfile
          ? "Your finished games will show up here."
          : "This player hasn't finished a game yet."
      }
      action={
        isOwnProfile && (
          // 44px tall on phones (touch), compact next to the table on desktop
          <Button asChild size="lg" className="md:h-8 md:gap-1.5 md:px-3">
            <Link to={ROUTES.PLAY}>Play your first game</Link>
          </Button>
        )
      }
    />
  );
  const total = pagination?.total;

  return (
    <section className="space-y-3">
      {isPreview && review ? (
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-xl leading-tight text-foreground sm:text-[22px]">{title}</h2>
          {actionHref && games.length > 0 && (
            <Link
              to={actionHref}
              className="relative touch-target text-[13px] font-semibold text-primary underline-offset-[3px] hover:underline"
            >
              View all
            </Link>
          )}
        </div>
      ) : isPreview && actionHref ? (
        <SectionHeader
          title={title}
          action={
            games.length > 0 && (
              <Link
                to={actionHref}
                className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                View all
              </Link>
            )
          }
        />
      ) : (
        !isPreview && (
          <SectionHeader
            title={
              <>
                {title}
                {total ? (
                  <span className="text-muted-foreground">
                    {" "}
                    {total.toLocaleString()}
                    {filtered && " matching"}
                  </span>
                ) : null}
              </>
            }
          />
        )
      )}

      {!isPreview && (
        <ProfileHistoryFilters
          filters={filters}
          activeCount={activeFilters}
          onChange={setFilter}
          onClear={clearFilters}
          ownProfile={isOwnProfile}
        />
      )}

      <div
        className={cn("hidden md:block", isPlaceholderData && "opacity-60 transition-opacity")}
        aria-busy={isPlaceholderData || undefined}
      >
        <DataTable
          columns={columns}
          data={shown}
          enablePagination={!isPreview}
          isLoading={showLoading}
          pageSize={rows}
          onPageChange={setPage}
          emptyState={emptyState}
          {...paginationProps}
        />
      </div>

      <div
        className={cn("space-y-3 md:hidden", isPlaceholderData && "opacity-60 transition-opacity")}
        aria-busy={isPlaceholderData || undefined}
      >
        <GameList
          games={shown}
          userId={userId}
          isLoading={showLoading}
          rows={rows}
          emptyState={emptyState}
        />
        {!isPreview && <Pagination onPageChange={setPage} {...paginationProps} />}
      </div>
    </section>
  );
};

export default GameTable;
