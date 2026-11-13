import { useId, useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TypedMoveInputProps {
  /**
   * Plays the typed text ("Nf3", "e2e4"). Return an error message to show,
   * or null once the move was played (the field is then cleared). Parse with
   * parseTypedMove and play through the same path as board moves.
   */
  onSubmit: (text: string) => string | null;
  label?: string;
  /** Shown under the field until there's an error */
  hint?: string;
  /**
   * Visually hidden until it gets keyboard focus, so it doesn't clutter the
   * panel for mouse and touch players (default). False: always visible.
   */
  revealOnFocus?: boolean;
  className?: string;
}

/**
 * Keyboard play: type a move in SAN ("Nf3") or coordinates ("g1f3") and
 * press Enter. Errors are read out politely. Arrow-key move navigation
 * leaves the field alone (it's an input).
 */
export const TypedMoveInput = ({
  onSubmit,
  label = "Type a move",
  hint = "Press Enter to play it.",
  revealOnFocus = true,
  className,
}: TypedMoveInputProps) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const hintId = useId();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!value.trim()) return;
    const problem = onSubmit(value);
    setError(problem);
    if (!problem) setValue("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("space-y-1.5", revealOnFocus && "sr-only focus-within:not-sr-only", className)}
    >
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <Input
        id={inputId}
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setError(null);
        }}
        placeholder="e.g. e4, Nf3, O-O, e7e8q"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="send"
        aria-invalid={error ? true : undefined}
        aria-describedby={hintId}
      />
      <p id={hintId} className="text-xs text-muted-foreground" aria-live="polite">
        {error ?? hint}
      </p>
    </form>
  );
};
