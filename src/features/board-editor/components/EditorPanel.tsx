import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle, Bot, Copy, Eraser, FlipVertical2, Microscope, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SegmentedRadioGroup } from "@/components/SegmentedRadioGroup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PlayerColor } from "@/features/game/types/game.types";
import { getAnalysisFromPositionRoute, getPlayBotsFromPositionRoute } from "@/constants/routes";
import { cn } from "@/lib/utils";
import {
  CASTLING_RIGHTS,
  EMPTY_PLACEMENT,
  STARTING_POSITION,
  enPassantOptions,
  parseFen,
  supportedCastling,
  toFen,
  type CastlingRight,
  type EditorPosition,
} from "../utils/editorPosition";

const CASTLING_LABELS: Record<CastlingRight, string> = {
  K: "White O-O",
  Q: "White O-O-O",
  k: "Black O-O",
  q: "Black O-O-O",
};

const NO_EN_PASSANT = "none";

interface EditorPanelProps {
  position: EditorPosition;
  onChange: (position: EditorPosition) => void;
  orientation: PlayerColor;
  onFlip: () => void;
  /** Why the position can't be played, or null */
  problem: string | null;
}

/**
 * The FEN field: shows the position at all times; typing or pasting a FEN
 * that reads applies it at once. While what's typed doesn't read, it says
 * so, and leaving the field puts the current FEN back.
 */
const FenField = ({ fen, onFen }: { fen: string; onFen: (position: EditorPosition) => void }) => {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? fen;
  const invalid = draft !== null && parseFen(draft) === null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fen);
      toast.success("FEN copied");
    } catch {
      toast.error("Couldn't copy. Select the text and copy it instead.");
    }
  };
  return (
    <div className="space-y-1.5">
      <Label htmlFor="editor-fen" className="text-xs text-muted-foreground">
        FEN
      </Label>
      <div className="flex gap-2">
        <Input
          id="editor-fen"
          value={shown}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="none"
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? "editor-fen-error" : undefined}
          className="h-10 font-mono text-xs"
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            setDraft(e.target.value);
            const parsed = parseFen(e.target.value);
            if (parsed) onFen(parsed);
          }}
          onBlur={() => setDraft(null)}
        />
        <Button type="button" variant="outline" size="icon-lg" onClick={copy} aria-label="Copy FEN" title="Copy FEN">
          <Copy aria-hidden="true" />
        </Button>
      </div>
      {invalid && (
        <p id="editor-fen-error" className="text-xs text-loss">
          That isn't a FEN this board can read. Paste one like {toFen(STARTING_POSITION)}.
        </p>
      )}
    </div>
  );
};

/** Everything beside the board: position controls, FEN, and where to take it. */
export const EditorPanel = ({ position, onChange, orientation, onFlip, problem }: EditorPanelProps) => {
  const fen = toFen(position);
  const castlingAllowed = supportedCastling(position.placement);
  const epOptions = enPassantOptions(position.placement, position.turn);
  const set = (change: Partial<EditorPosition>) => onChange({ ...position, ...change });

  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-card p-4 sm:p-5">
      <PageHeader
        title="Board editor"
        description="Set up any position, then analyse it or play it against the computer."
      />

      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" onClick={() => onChange(STARTING_POSITION)}>
          <RotateCcw aria-hidden="true" /> Start
        </Button>
        <Button
          variant="outline"
          onClick={() => onChange({ ...position, placement: EMPTY_PLACEMENT, castling: [], enPassant: null })}
        >
          <Eraser aria-hidden="true" /> Clear
        </Button>
        <Button variant="outline" onClick={onFlip} aria-keyshortcuts="F" title="Flip board (F)">
          <FlipVertical2 aria-hidden="true" /> Flip
          <span className="sr-only">{` (now ${orientation} at the bottom)`}</span>
        </Button>
      </div>

      <div className="space-y-1">
        <p aria-hidden="true" className="text-xs font-medium text-muted-foreground">
          Side to move
        </p>
        <SegmentedRadioGroup
          label="Side to move"
          value={position.turn}
          onValueChange={(turn) => set({ turn })}
          options={[
            { value: "w", label: "White" },
            { value: "b", label: "Black" },
          ]}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-muted-foreground">Castling</legend>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {CASTLING_RIGHTS.map((right) => {
            const allowed = castlingAllowed.includes(right);
            return (
              <label
                key={right}
                className={cn(
                  "flex min-h-8 items-center gap-2 text-sm",
                  allowed ? "cursor-pointer text-foreground" : "cursor-not-allowed text-muted-foreground/60"
                )}
                title={allowed ? undefined : "The king and rook aren't on their starting squares"}
              >
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={position.castling.includes(right)}
                  disabled={!allowed}
                  onChange={(e) =>
                    set({
                      castling: e.target.checked
                        ? CASTLING_RIGHTS.filter((r) => r === right || position.castling.includes(r))
                        : position.castling.filter((r) => r !== right),
                    })
                  }
                />
                {CASTLING_LABELS[right]}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="editor-ep" className="text-xs text-muted-foreground">
          En passant
        </Label>
        <Select
          value={position.enPassant ?? NO_EN_PASSANT}
          onValueChange={(v) => set({ enPassant: v === NO_EN_PASSANT ? null : v })}
          disabled={epOptions.length === 0}
        >
          <SelectTrigger id="editor-ep" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_EN_PASSANT}>
              {epOptions.length === 0 ? "No pawn can be taken en passant" : "None"}
            </SelectItem>
            {epOptions.map((square) => (
              <SelectItem key={square} value={square}>
                {square}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <FenField fen={fen} onFen={onChange} />

      {problem && (
        <p role="status" className="flex items-start gap-2 rounded-lg bg-loss-bg px-3 py-2.5 text-sm text-loss">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {problem}
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {problem ? (
          <>
            <Button size="lg" disabled>
              <Microscope aria-hidden="true" /> Analyse
            </Button>
            <Button size="lg" variant="outline" disabled>
              <Bot aria-hidden="true" /> Play the computer
            </Button>
          </>
        ) : (
          <>
            <Button size="lg" asChild>
              <Link to={getAnalysisFromPositionRoute(fen)}>
                <Microscope aria-hidden="true" /> Analyse
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to={getPlayBotsFromPositionRoute(fen)}>
                <Bot aria-hidden="true" /> Play the computer
              </Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
