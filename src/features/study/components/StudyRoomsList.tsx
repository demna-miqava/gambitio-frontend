import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNowStrict } from "date-fns";
import { AlertCircle, BookOpenText, LogOut, Plus, RotateCw, Trash2, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { getStudyRoomRoute } from "@/constants/routes";
import { useUser } from "@/hooks/useUser";
import type { StudyRoomListItem } from "../types";
import { useLeaveOrDeleteRoom, useStudyRooms } from "../hooks/useStudyRooms";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const RoomRow = ({
  room,
  isOwner,
  onRemove,
}: {
  room: StudyRoomListItem;
  isOwner: boolean;
  onRemove: () => void;
}) => (
  <li className="flex items-center gap-3 rounded-xl bg-card p-3 sm:p-4">
    <span className="hidden size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-primary sm:flex">
      <BookOpenText className="size-5" aria-hidden="true" />
    </span>
    <div className="min-w-0 flex-1">
      <Link
        to={getStudyRoomRoute(room.id)}
        className="block truncate font-medium text-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
      >
        {room.name}
      </Link>
      <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        <span>{isOwner ? "Yours" : `By ${room.ownerUsername}`}</span>
        {room.gameId != null && <span>Watching a game</span>}
        <span className="inline-flex items-center gap-1">
          <UsersRound className="size-3" aria-hidden="true" />
          {plural(room.memberCount, "member")}
        </span>
        <span>{plural(room.moveCount, "move")}</span>
        <span>
          Updated{" "}
          <time dateTime={room.updatedAt}>
            {formatDistanceToNowStrict(new Date(room.updatedAt), { addSuffix: true })}
          </time>
        </span>
      </p>
    </div>
    <Button size="sm" asChild className="shrink-0">
      <Link to={getStudyRoomRoute(room.id)} aria-label={`Open ${room.name}`}>
        Open
      </Link>
    </Button>
    <Button
      size="icon"
      variant="ghost"
      onClick={onRemove}
      aria-label={isOwner ? `Delete ${room.name}` : `Leave ${room.name}`}
      title={isOwner ? "Delete room" : "Leave room"}
      className="shrink-0 text-muted-foreground hover:text-destructive"
    >
      {isOwner ? <Trash2 aria-hidden="true" /> : <LogOut aria-hidden="true" />}
    </Button>
  </li>
);

/** The signed-in player's study rooms, with delete (owner) and leave. */
export const StudyRoomsList = ({ onCreate }: { onCreate: () => void }) => {
  const { id: userId } = useUser();
  const { data: rooms, isPending, isError, isFetching, refetch } = useStudyRooms();
  const remove = useLeaveOrDeleteRoom();
  const [confirming, setConfirming] = useState<StudyRoomListItem | null>(null);
  const confirmingOwn = confirming?.ownerId === userId;

  if (isPending) {
    return (
      <ul className="flex flex-col gap-3" aria-busy="true" aria-label="Loading study rooms">
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <Skeleton className="h-[74px] w-full rounded-xl" />
          </li>
        ))}
      </ul>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load your study rooms"
        description="Check your connection and try again."
        action={
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RotateCw className={isFetching ? "animate-spin" : undefined} aria-hidden="true" /> Try again
          </Button>
        }
      />
    );
  }

  if (rooms.length === 0) {
    return (
      <EmptyState
        icon={BookOpenText}
        title="No study rooms yet"
        description="Create one, invite friends, and explore a position or review a game together."
        action={
          <Button onClick={onCreate}>
            <Plus aria-hidden="true" /> New room
          </Button>
        }
      />
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3" aria-label="Your study rooms">
        {rooms.map((room) => (
          <RoomRow
            key={room.id}
            room={room}
            isOwner={room.ownerId === userId}
            onRemove={() => setConfirming(room)}
          />
        ))}
      </ul>
      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={confirmingOwn ? `Delete “${confirming?.name}”?` : `Leave “${confirming?.name}”?`}
        description={
          confirmingOwn
            ? "The analysis is deleted for everyone in the room. This can't be undone."
            : "You can come back only if someone in the room invites you again."
        }
        confirmLabel={confirmingOwn ? "Delete" : "Leave"}
        destructive
        isPending={remove.isPending}
        onConfirm={() => {
          if (!confirming || userId === undefined) return;
          remove.mutate(
            { roomId: confirming.id, userId, owner: confirmingOwn },
            { onSuccess: () => setConfirming(null) }
          );
        }}
      />
    </>
  );
};
