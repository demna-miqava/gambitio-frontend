import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import { usePgnInput } from "../hooks/usePgnInput";

interface ImportGameFormProps {
  onLoadPgn: (pgn: string) => void;
}

/** Paste a PGN to review it; same panel style as the other board pages. */
export const ImportGameForm = ({ onLoadPgn }: ImportGameFormProps) => {
  const { pgnInput, error, handleInputChange, handleLoadPgn, handleClear } =
    usePgnInput({ onLoadPgn });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleLoadPgn();
      }}
      className="flex flex-col gap-5 rounded-2xl border border-border/70 bg-card p-4 sm:p-5"
    >
      {/* The page's h1 is for screen readers; this is the visible title */}
      <PageHeader
        as="h2"
        title="Import a game"
        description="Paste a game in PGN format to step through it and analyze it with the engine."
      />
      <div className="space-y-2">
        <Label htmlFor="pgn-input">PGN</Label>
        <Textarea
          id="pgn-input"
          placeholder={'[Event "Casual game"]\n1. e4 e5 2. Nf3 Nc6 …'}
          value={pgnInput}
          onChange={(e) => handleInputChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "pgn-error" : undefined}
          spellCheck={false}
          className="min-h-[220px] font-mono text-sm"
        />
        {error && (
          <p id="pgn-error" role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="lg" className="flex-1">
          Load game
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleClear}
          disabled={!pgnInput}
        >
          Clear
        </Button>
      </div>
    </form>
  );
};
