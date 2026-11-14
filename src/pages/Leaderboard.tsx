import { useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, Trophy } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PageContainer } from "@/components/PageContainer";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useUser } from "@/hooks/useUser";
import { getProfileFriendsRoute } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { useLeaderboard } from "@/features/leaderboard/hooks/useLeaderboard";
import { LeaderboardTable } from "@/features/leaderboard/components/LeaderboardTable";
import { YourRankBar } from "@/features/leaderboard/components/YourRankBar";
import {
  parsePage,
  parseScope,
  parseVariant,
  pinnedEntry,
  capitalize,
  variantInfo,
} from "@/features/leaderboard/utils/leaderboard";
import {
  LEADERBOARD_PAGE_SIZE,
  LEADERBOARD_VARIANTS,
} from "@/features/leaderboard/variants";
import type { LeaderboardScope } from "@/features/leaderboard/types";

const SCOPES: { value: LeaderboardScope; label: string }[] = [
  { value: "global", label: "Global" },
  { value: "friends", label: "Friends" },
];

const Leaderboard = () => {
  useDocumentTitle("Leaderboard");
  const { id: currentUserId } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const variant = parseVariant(searchParams.get("variant"));
  const scope = parseScope(searchParams.get("scope"));
  const page = parsePage(searchParams.get("page"));

  /** Updates the URL; switching board goes back to page 1. */
  const update = useCallback(
    (changes: { variant?: string; scope?: string; page?: number }) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (changes.variant) next.set("variant", changes.variant);
          if (changes.scope) next.set("scope", changes.scope);
          const nextPage = changes.page ?? 1;
          if (nextPage > 1) next.set("page", String(nextPage));
          else next.delete("page");
          return next;
        },
        { replace: changes.page === undefined }
      ),
    [setSearchParams]
  );

  const { data, isPending, isError, isFetching, isPlaceholderData, refetch } = useLeaderboard({
    variant,
    scope,
    page,
    limit: LEADERBOARD_PAGE_SIZE,
  });

  const info = variantInfo(variant);
  const label = info.label;
  const entries = data?.data ?? [];
  const totalPages = data?.pagination.totalPages ?? 1;
  const total = data?.pagination.total ?? 0;
  const pinned = isPlaceholderData ? null : pinnedEntry(data);

  const showPage = (next: number) => {
    update({ page: next });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const emptyState = (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-brand-soft text-primary">
        <Trophy className="size-5" aria-hidden="true" />
      </span>
      {page > 1 && total > 0 ? (
        <>
          <p className="font-medium text-foreground">This page is empty</p>
          <Button size="sm" variant="outline" onClick={() => showPage(1)}>
            Back to the top
          </Button>
        </>
      ) : scope === "friends" ? (
        <>
          <div>
            <p className="font-medium text-foreground">No friends ranked in {label} yet</p>
            <p className="text-sm text-muted-foreground">
              Friends show up here once they {info.howToRank}.
            </p>
          </div>
          {currentUserId && (
            <Button asChild size="sm" variant="outline" className="mt-1">
              <Link to={getProfileFriendsRoute(currentUserId)}>Find friends</Link>
            </Button>
          )}
        </>
      ) : (
        <>
          <div>
            <p className="font-medium text-foreground">No one is ranked in {label} yet</p>
            <p className="text-sm text-muted-foreground">
              {capitalize(info.howToRank)} to take the top spot.
            </p>
          </div>
          <Button asChild size="sm" className="mt-1">
            <Link to={info.cta.to}>{info.cta.label}</Link>
          </Button>
        </>
      )}
    </div>
  );

  const board = isError ? (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-12 text-center"
    >
      <AlertCircle className="size-6 text-destructive" aria-hidden="true" />
      <p className="font-medium text-foreground">Couldn't load the leaderboard</p>
      <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
        Try again
      </Button>
    </div>
  ) : (
    <div className="space-y-4">
      <LeaderboardTable
        entries={entries}
        currentUserId={currentUserId}
        caption={`${label} leaderboard, ${scope === "friends" ? "friends" : "all players"}, page ${page}`}
        isLoading={isPending}
        isFetching={isPlaceholderData}
        skeletonRows={10}
        emptyState={emptyState}
        countLabel={info.countLabel}
      />

      {pinned && <YourRankBar me={pinned} total={total} onShowPage={showPage} />}

      {!isPending && !data?.me && (
        <p className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          You're not ranked in {label} yet. {capitalize(info.howToRank)} to get on the board.{" "}
          <Link to={info.cta.to} className="font-medium text-foreground underline-offset-4 hover:underline">
            {info.cta.label}
          </Link>
        </p>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={showPage}
        hasNextPage={page < totalPages}
        hasPreviousPage={page > 1}
      />
    </div>
  );

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Leaderboard"
        description="Players ranked by rating. You're listed once you've finished a rated game in that time control, or tried a rated puzzle."
        actions={
          <div
            role="group"
            aria-label="Players to rank"
            className="inline-flex h-10 items-center gap-5 border-b border-border"
          >
            {SCOPES.map(({ value, label: scopeLabel }) => (
              <button
                key={value}
                type="button"
                aria-pressed={scope === value}
                onClick={() => scope !== value && update({ scope: value })}
                className={cn(
                  // 30px tall; touch-target extends the hit area to 44px on touch screens
                  "relative touch-target inline-flex h-full items-center gap-1.5 px-0.5 text-sm font-medium transition-colors after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  scope === value
                    ? "text-foreground after:bg-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {scopeLabel}
              </button>
            ))}
          </div>
        }
      />

      <Tabs value={variant} onValueChange={(value) => update({ variant: value })} className="gap-4">
        <TabsList aria-label="Time control" className="w-full sm:w-fit">
          {LEADERBOARD_VARIANTS.map(({ value, label: tabLabel }) => (
            <TabsTrigger key={value} value={value} className="relative touch-target px-2 sm:px-4">
              {tabLabel}
            </TabsTrigger>
          ))}
        </TabsList>
        {LEADERBOARD_VARIANTS.map(({ value }) => (
          <TabsContent key={value} value={value}>
            {value === variant && board}
          </TabsContent>
        ))}
      </Tabs>
    </PageContainer>
  );
};

export default Leaderboard;
