import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/UserAvatar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { QKEY_USER_FRIENDS } from "@/constants/queryKeys";
import { useDebounce } from "@/hooks/useDebounce";
import { getUserFriends } from "@/services/user";
import { inviteToStudyRoom, removeStudyMember } from "@/services/study";
import { cn } from "@/lib/utils";
import type { StudyMember } from "../types";
import { apiErrorMessage } from "../utils/studyState";

/** Max members a room holds (the server's MAX_ROOM_MEMBERS). */
const MAX_ROOM_MEMBERS = 20;

const InviteDialog = ({
  open,
  onOpenChange,
  roomId,
  myId,
  members,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: number;
  myId: number;
  members: StudyMember[];
}) => {
  const [search, setSearch] = useState("");
  const query = useDebounce(search.trim(), 300);
  const friends = useQuery({
    queryKey: [QKEY_USER_FRIENDS, myId, "study-invite", query],
    queryFn: () => getUserFriends(myId, new URLSearchParams({ page: "1", limit: "50", ...(query && { q: query }) }).toString()),
    enabled: open,
  });
  const invite = useMutation({
    mutationFn: (userId: number) => inviteToStudyRoom(roomId, userId),
    onSuccess: (_, userId) => {
      const name = friends.data?.data.find((f) => f.id === userId)?.username;
      toast.success(name ? `${name} was added to the room` : "Added to the room");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Couldn't invite them. Try again.")),
  });
  const memberIds = new Set(members.map((m) => m.id));
  const full = members.length >= MAX_ROOM_MEMBERS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite friends</DialogTitle>
          <DialogDescription>
            They join the room right away and get a notification with a link.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your friends"
          aria-label="Search your friends"
          autoComplete="off"
        />
        {full && (
          <p role="status" className="text-sm text-muted-foreground">
            The room is full ({MAX_ROOM_MEMBERS} people).
          </p>
        )}
        <div className="max-h-80 min-h-24 overflow-y-auto">
          {friends.isPending ? (
            <div className="space-y-2" aria-busy="true" aria-label="Loading friends">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          ) : friends.isError ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Couldn't load your friends.{" "}
              <Button variant="link" className="h-auto p-0" onClick={() => friends.refetch()}>
                Try again
              </Button>
            </p>
          ) : friends.data.data.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {query ? `No friends match “${query}”.` : "Add friends first to invite them."}
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {friends.data.data.map((friend) => {
                const inRoom = memberIds.has(friend.id);
                const inviting = invite.isPending && invite.variables === friend.id;
                return (
                  <li key={friend.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                    <UserAvatar src={friend.avatarUrl} username={friend.username} className="size-8" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{friend.username}</span>
                    {inRoom ? (
                      <span className="text-xs text-muted-foreground">In the room</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={full || invite.isPending}
                        onClick={() => invite.mutate(friend.id)}
                        aria-label={`Invite ${friend.username}`}
                      >
                        {inviting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <UserPlus aria-hidden="true" />}
                        Invite
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Who's in the room: members with a dot for those who have it open, an
 * invite button (any member may invite their friends) and, for the owner,
 * removing someone.
 */
export const StudyPeople = ({
  roomId,
  ownerId,
  myId,
  members,
  present,
}: {
  roomId: number;
  ownerId: number;
  myId: number;
  members: StudyMember[];
  present: number[];
}) => {
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<StudyMember | null>(null);
  const isOwner = myId === ownerId;
  const here = new Set(present);
  const remove = useMutation({
    mutationFn: (userId: number) => removeStudyMember(roomId, userId),
    onSuccess: () => setRemoving(null),
    onError: (error) => toast.error(apiErrorMessage(error, "Couldn't remove them. Try again.")),
  });
  const online = members.filter((m) => here.has(m.id)).length;

  return (
    <section aria-labelledby="study-people" className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 id="study-people" className="text-sm text-muted-foreground">
          People <span className="normal-case tracking-normal">· {online} here</span>
        </h3>
        <Button size="sm" variant="ghost" onClick={() => setInviting(true)} className="-mr-2">
          <UserPlus aria-hidden="true" /> Invite
        </Button>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {members.map((member) => {
          const isHere = here.has(member.id);
          return (
            <li
              key={member.id}
              className="group flex items-center gap-1.5 rounded-full border border-border py-0.5 pr-1 pl-0.5"
            >
              <span className="relative">
                <UserAvatar src={member.avatarUrl} username={member.username} className="size-6" />
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-card",
                    isHere ? "bg-emerald-500" : "bg-muted-foreground/40"
                  )}
                />
              </span>
              <span className={cn("max-w-28 truncate text-xs", isHere ? "text-foreground" : "text-muted-foreground")}>
                {member.username}
                {member.id === myId && " (you)"}
                <span className="sr-only">
                  {member.id === ownerId ? ", owner" : ""}
                  {isHere ? ", here now" : ", away"}
                </span>
              </span>
              {isOwner && member.id !== myId ? (
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-6 rounded-full text-muted-foreground hover:text-destructive"
                  onClick={() => setRemoving(member)}
                  aria-label={`Remove ${member.username} from the room`}
                  title="Remove from the room"
                >
                  <UserMinus className="size-3.5" aria-hidden="true" />
                </Button>
              ) : (
                <span className="w-1" />
              )}
            </li>
          );
        })}
      </ul>

      <InviteDialog
        open={inviting}
        onOpenChange={setInviting}
        roomId={roomId}
        myId={myId}
        members={members}
      />
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Remove ${removing?.username} from the room?`}
        description="They lose access at once. You can invite them again later."
        confirmLabel="Remove"
        destructive
        isPending={remove.isPending}
        onConfirm={() => removing && remove.mutate(removing.id)}
      />
    </section>
  );
};
