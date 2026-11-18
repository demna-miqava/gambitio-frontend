import { FriendsList } from "./FriendsList";
import { FriendsListSkeleton } from "./FriendsListSkeleton";
import type { FriendCardMode } from "../../components/FriendCard";
import { Pagination } from "@/components/Pagination";
import type { Friend, FriendActionHandlers } from "@/types";
import type { ReactNode } from "react";

interface FriendsPaginatedListProps extends FriendActionHandlers {
  friends: Friend[];
  page: number;
  setPage: (page: number) => void;
  pagination?: {
    total: number;
    totalPages: number;
  };
  isLoading?: boolean;
  /** Placeholder rows while loading: the number of friends expected on this page */
  skeletonRows?: number;
  searchSlot?: ReactNode;
  emptyMessage?: ReactNode;
  showPagination?: boolean;
  mode?: FriendCardMode;
  currentUserId?: number;
  isOwnProfile?: boolean;
}

export const FriendsPaginatedList = ({
  friends,
  page,
  setPage,
  pagination,
  isLoading = false,
  skeletonRows,
  onChallenge,
  onRemove,
  searchSlot,
  emptyMessage = "No friends yet",
  showPagination = true,
  currentUserId,
  isOwnProfile,
  mode,
}: FriendsPaginatedListProps) => {
  const totalPages = pagination?.totalPages ?? 1;
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return (
    <div className="space-y-4">
      {searchSlot && <div className="w-full">{searchSlot}</div>}

      {isLoading ? (
        <FriendsListSkeleton rows={skeletonRows} mode={mode} />
      ) : (
        <FriendsList
          items={friends}
          emptyMessage={emptyMessage}
          onChallenge={onChallenge}
          onRemove={onRemove}
          currentUserId={currentUserId}
          isOwnProfile={isOwnProfile}
          mode={mode}
        />
      )}

      {showPagination && totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
        />
      )}
    </div>
  );
};
