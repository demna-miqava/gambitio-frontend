import { formatDate } from "@/lib/utils";

const InfoSection = ({
  username,
  joinedAt,
  friendsCount,
}: {
  username: string;
  joinedAt: string;
  friendsCount: number;
}) => {
  return (
    <div className="min-w-0 space-y-1.5">
      <h1 className="truncate font-display text-3xl font-semibold text-foreground sm:text-4xl">
        {username}
      </h1>
      <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
        {joinedAt && <span>Joined {formatDate(joinedAt)}</span>}
        {joinedAt && <span aria-hidden="true">·</span>}
        <span>
          {friendsCount} {friendsCount === 1 ? "friend" : "friends"}
        </span>
      </p>
    </div>
  );
};

export default InfoSection;
