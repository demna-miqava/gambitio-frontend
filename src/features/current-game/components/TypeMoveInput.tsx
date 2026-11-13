import { useId, useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { useLiveGame } from "../contexts/LiveGameContext";

/**
 * Keyboard play: type a move in SAN ("Nf3") or coordinates ("g1f3") and press
 * Enter. Hidden until it gets keyboard focus, so it doesn't clutter the
 * panel for mouse and touch players. Moves go through the same path as
 * board moves.
 */
export const TypeMoveInput = () => {
  const { submitTypedMove, gameEnded } = useLiveGame();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const hintId = useId();

  if (gameEnded) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!value.trim()) return;
    const problem = submitTypedMove(value);
    setError(problem);
    if (!problem) setValue("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="sr-only space-y-1.5 focus-within:not-sr-only"
    >
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        Type a move
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
        {error ?? "Press Enter to play it."}
      </p>
    </form>
  );
};
