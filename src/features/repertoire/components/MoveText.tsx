import { cn } from "@/lib/utils";

/**
 * A line as numbered moves ("1. e4 e5 2. Nf3"), the move numbers dimmed.
 * Long lines wrap; `clamp` keeps them to two rows in lists.
 */
export const MoveText = ({
  moves,
  clamp = false,
  className,
}: {
  moves: readonly string[];
  clamp?: boolean;
  className?: string;
}) => (
  <p className={cn("text-sm leading-6 text-foreground", clamp && "line-clamp-2", className)}>
    {moves.map((san, i) => (
      <span key={i} className="whitespace-nowrap">
        {i % 2 === 0 && <span className="text-muted-foreground tabular-nums">{i / 2 + 1}.&nbsp;</span>}
        <span className="font-medium">{san}</span>{" "}
      </span>
    ))}
  </p>
);
