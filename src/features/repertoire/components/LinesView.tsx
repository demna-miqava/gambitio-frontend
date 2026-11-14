import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Dumbbell, Microscope, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SectionHeader } from "@/components/PageHeader";
import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/lib/utils";
import type { PlayerColor } from "@/features/game/types/game.types";
import type { RepertoireLine } from "@/services/repertoire";
import { useDeleteLine, useUpdateLine } from "../hooks/useRepertoire";
import { groupLines, isDue } from "../utils/lines";
import { apiErrorCode } from "../utils/errors";
import { viewSearch } from "../utils/view";
import { LineCard } from "./LineCard";
import { AddLineDialog } from "./AddLineDialog";
import { RenameLineDialog } from "./RenameLineDialog";

const COLORS: { value: PlayerColor; label: string }[] = [
  { value: "white", label: "White" },
  { value: "black", label: "Black" },
];

/** How to start a repertoire: the analysis board, or typing a line. */
const NoLines = ({ color, onAdd }: { color: PlayerColor; onAdd: () => void }) => (
  <EmptyState
    icon={BookOpen}
    title={`No ${color} lines yet`}
    description={`Play a line on the analysis board (or in a game review) and choose “Save to repertoire”, or type its moves here.`}
    action={
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline" asChild>
          <Link to={ROUTES.TOOLS.ANALYSIS_BOARD}>
            <Microscope aria-hidden="true" /> Analysis board
          </Link>
        </Button>
        <Button onClick={onAdd}>
          <Plus aria-hidden="true" /> Add a line
        </Button>
      </div>
    }
  />
);

interface LinesViewProps {
  lines: RepertoireLine[];
  color: PlayerColor;
  onColorChange: (color: PlayerColor) => void;
}

/** The player's lines for each colour, grouped by opening move. */
export const LinesView = ({ lines, color, onColorChange }: LinesViewProps) => {
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState<RepertoireLine | null>(null);
  const [deleting, setDeleting] = useState<RepertoireLine | null>(null);
  const update = useUpdateLine();
  const remove = useDeleteLine();
  // Read once per render; due labels don't need to tick
  const [now] = useState(() => Date.now());

  const byColor = useMemo(
    () => ({
      white: groupLines(lines.filter((l) => l.color === "white")),
      black: groupLines(lines.filter((l) => l.color === "black")),
    }),
    [lines]
  );
  const dueCount = lines.filter((l) => isDue(l, now)).length;

  const switchColor = (line: RepertoireLine) => {
    const other: PlayerColor = line.color === "white" ? "black" : "white";
    update.mutate(
      { id: line.id, color: other },
      {
        onSuccess: () => toast.success(`Moved “${line.name}” to ${other}`),
        onError: (error) =>
          toast.error(
            apiErrorCode(error) === "CONFLICT"
              ? `Your ${other} repertoire already has this line`
              : getApiErrorMessage(error, "Couldn't move the line")
          ),
      }
    );
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const line = deleting;
    remove.mutate(line.id, {
      onSuccess: () => {
        setDeleting(null);
        toast.success(`Deleted “${line.name}”`);
      },
      onError: (error) => toast.error(getApiErrorMessage(error, "Couldn't delete the line")),
    });
  };

  return (
    <div className="space-y-6">
      {lines.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 sm:flex-row sm:items-center">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-primary">
            <Dumbbell className="size-5" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <p className="font-medium text-foreground">
              {dueCount > 0
                ? `${dueCount} ${dueCount === 1 ? "line is" : "lines are"} due for practice`
                : "You're up to date"}
            </p>
            <p className="text-sm text-muted-foreground">
              Recall your moves while the opponent's play themselves. Lines you know come back less often.
            </p>
          </div>
          <Button asChild>
            <Link to={`${ROUTES.REPERTOIRE}${viewSearch("practice")}`}>
              {dueCount > 0 ? "Practice due lines" : "Practice anyway"}
            </Link>
          </Button>
        </div>
      )}

      <Tabs value={color} onValueChange={(value) => onColorChange(value as PlayerColor)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList aria-label="Colour">
            {COLORS.map((c) => (
              <TabsTrigger key={c.value} value={c.value} className="px-4">
                {c.label}
                <span className="text-xs tabular-nums text-muted-foreground">
                  {lines.filter((l) => l.color === c.value).length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          {lines.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to={ROUTES.TOOLS.ANALYSIS_BOARD}>
                  <Microscope aria-hidden="true" /> Analysis board
                </Link>
              </Button>
              <Button size="sm" onClick={() => setAdding(true)}>
                <Plus aria-hidden="true" /> Add line
              </Button>
            </div>
          )}
        </div>

        {COLORS.map((c) => (
          <TabsContent key={c.value} value={c.value} className="mt-4 space-y-6">
            {byColor[c.value].length === 0 ? (
              <NoLines color={c.value} onAdd={() => setAdding(true)} />
            ) : (
              byColor[c.value].map((group) => (
                <section key={group.title} className="space-y-3" aria-label={group.title}>
                  <SectionHeader
                    title={
                      <>
                        {group.title}{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          · {group.lines.length} {group.lines.length === 1 ? "line" : "lines"}
                        </span>
                      </>
                    }
                  />
                  <ul className="space-y-2">
                    {group.lines.map((line) => (
                      <LineCard
                        key={line.id}
                        line={line}
                        now={now}
                        onRename={setRenaming}
                        onSwitchColor={switchColor}
                        onDelete={setDeleting}
                      />
                    ))}
                  </ul>
                </section>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      <AddLineDialog open={adding} onOpenChange={setAdding} defaultColor={color} />
      <RenameLineDialog line={renaming} onOpenChange={(open) => !open && setRenaming(null)} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete “${deleting?.name ?? ""}”?`}
        description="Its practice record goes with it."
        confirmLabel="Delete"
        destructive
        isPending={remove.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
};
