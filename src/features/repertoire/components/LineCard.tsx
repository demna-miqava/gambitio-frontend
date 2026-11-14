import { Link } from "react-router-dom";
import { ArrowLeftRight, Dumbbell, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { RepertoireLine } from "@/services/repertoire";
import { dueLabel, isDue, lineAccuracy } from "../utils/lines";
import { viewSearch } from "../utils/view";
import { MoveText } from "./MoveText";

interface LineCardProps {
  line: RepertoireLine;
  now: number;
  onRename: (line: RepertoireLine) => void;
  onSwitchColor: (line: RepertoireLine) => void;
  onDelete: (line: RepertoireLine) => void;
}

/** One line: name, moves, practice record and its actions. */
export const LineCard = ({ line, now, onRename, onSwitchColor, onDelete }: LineCardProps) => {
  const accuracy = lineAccuracy(line);
  const due = isDue(line, now);
  const other = line.color === "white" ? "Black" : "White";

  return (
    <li className="flex flex-col gap-3 rounded-xl bg-card p-4 sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h4 className="truncate font-display text-foreground">{line.name}</h4>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              due ? "bg-brand-soft text-primary" : "bg-muted text-muted-foreground"
            )}
          >
            {dueLabel(line.dueAt, now)}
          </span>
        </div>
        <MoveText moves={line.moves} clamp />
        <p className="text-xs text-muted-foreground">
          {accuracy === null
            ? "Not practised yet"
            : `${Math.round(accuracy * 100)}% recalled in ${line.practiceAttempts} ${
                line.practiceAttempts === 1 ? "run" : "runs"
              } · streak ${line.streak}`}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button variant="outline" size="sm" asChild>
          <Link to={`${ROUTES.REPERTOIRE}${viewSearch("practice", { line: line.id })}`}>
            <Dumbbell aria-hidden="true" /> Practice
            <span className="sr-only"> {line.name}</span>
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`More actions for ${line.name}`}>
              <MoreHorizontal aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={() => onRename(line)}>
              <Pencil /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onSwitchColor(line)}>
              <ArrowLeftRight /> Move to {other}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(line)}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
};
