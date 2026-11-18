import { type ColumnDef } from "@tanstack/react-table";
import { TimeControlCell } from "./components/TimeControlCell";
import { PlayerCell } from "./components/PlayerCell";
import { ResultBadge } from "./components/ResultBadge";
import { Link } from "react-router-dom";
import { getArchiveGameRoute } from "@/constants/routes";
import { formatShortDate } from "@/lib/utils";
import type { StoredGameListItem } from "@/types";
import { getResult, getScore } from "./utils/gameResult";
import { fullMoves } from "@/utils/moves";

export const createColumns = (currentUserId?: number): ColumnDef<StoredGameListItem>[] => [
  {
    accessorKey: "timeControl",
    header: () => <span className="sr-only">Time control</span>,
    size: 110,
    minSize: 90,
    maxSize: 120,
    cell: ({ row }) => {
      const { type, time, increment, whiteTime, blackTime, rated } = row.original;
      return (
        <TimeControlCell
          type={type}
          time={time}
          increment={increment}
          whiteTime={whiteTime}
          blackTime={blackTime}
          rated={rated}
        />
      );
    },
  },

  {
    accessorKey: "Players",
    header: "Players",
    cell: ({ row }) => {
      const { id, blackPlayer, whitePlayer, botId } = row.original;
      return (
        <Link
          to={getArchiveGameRoute(id)}
          className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          <span className="sr-only">Review game: </span>
          <PlayerCell white={whitePlayer} black={blackPlayer} isBotGame={botId !== null} />
        </Link>
      );
    },
  },
  {
    accessorKey: "result",
    header: "Result",
    cell: ({ row }) => {
      const result =
        row.original.status === "in_progress" ? "live" : getResult(row.original, currentUserId);
      return <ResultBadge result={result} score={getScore(row.original)} />;
    },
  },
  {
    accessorKey: "numMoves",
    header: "Moves",
    cell: ({ row }) => {
      return (
        <span className="tabular-nums text-muted-foreground">
          {row.original.numMoves == null ? "–" : fullMoves(row.original.numMoves)}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => {
      const date = row.original.createdAt;
      return (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatShortDate(date)}
        </span>
      );
    },
  },
];
