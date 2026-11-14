import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Swords } from "lucide-react";
import { createColumns } from "./Columns";
import { useUserGames } from "./hooks/useUserGames";
import { DataTable } from "./DataTable";
import { GameList } from "./components/GameList";
import { useProfileUserId } from "@/hooks/useProfileUserId";
import { useUser } from "@/hooks/useUser";
import { SectionHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/Pagination";
import { EmptyState } from "@/components/EmptyState";
import { ROUTES } from "@/constants/routes";

type GameTableVariant = "preview" | "full";

export type GameTableProps = {
  variant?: GameTableVariant;
  title?: string;
  actionHref?: string;
  limit?: number;
  /**
   * Leave out the newest game (Home shows it in "Your last game"). The list
   * is hidden when that was the only one.
   */
  skipLatest?: boolean;
};

export const GameTable = ({
  variant = "full",
  title = "Recent games",
  actionHref,
  limit = 10,
  skipLatest = false,
}: GameTableProps) => {
  const isPreview = variant === "preview";
  const userId = useProfileUserId();
  const { id: currentUserId } = useUser();
  const isOwnProfile = userId === currentUserId;

  const { games: loaded, isPending, page, setPage, pagination } = useUserGames({
    defaultLimit: limit,
  });
  // Only a finished game is featured (see LastGameCard)
  const games = skipLatest && loaded[0]?.status === "finished" ? loaded.slice(1) : loaded;

  const columns = useMemo(() => createColumns(userId), [userId]);

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

  const emptyState = (
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
  // Nothing besides the featured game: no empty "No games yet" under it
  if (skipLatest && !showLoading && loaded.length > 0 && games.length === 0) return null;

  return (
    <section className="space-y-3">
      {isPreview && actionHref ? (
        <SectionHeader
          title={title}
          action={
            games.length > 0 && (
              <Link
                to={actionHref}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                View all <ArrowRight className="size-3.5" aria-hidden="true" />
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
                  <span className="font-normal text-muted-foreground"> {total.toLocaleString()}</span>
                ) : null}
              </>
            }
          />
        )
      )}

      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={games}
          enablePagination={!isPreview}
          isLoading={showLoading}
          pageSize={limit}
          onPageChange={setPage}
          emptyState={emptyState}
          {...paginationProps}
        />
      </div>

      <div className="space-y-3 md:hidden">
        <GameList
          games={games}
          userId={userId}
          isLoading={showLoading}
          rows={limit}
          emptyState={emptyState}
        />
        {!isPreview && <Pagination onPageChange={setPage} {...paginationProps} />}
      </div>
    </section>
  );
};

export default GameTable;
