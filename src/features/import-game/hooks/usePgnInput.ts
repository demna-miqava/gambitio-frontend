import { useState, useCallback } from "react";
import { parsePgn, PgnParseError } from "@/features/archive-game/utils/pgn";

interface UsePgnInputProps {
  onLoadPgn: (pgn: string) => void;
}

export const usePgnInput = ({ onLoadPgn }: UsePgnInputProps) => {
  const [pgnInput, setPgnInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = useCallback((value: string) => {
    setPgnInput(value);
    setError(null);
  }, []);

  const handleLoadPgn = useCallback(() => {
    if (!pgnInput.trim()) {
      setError("Paste a PGN first.");
      return;
    }

    // Same parser the analysis uses, so variations and FEN setups import too
    try {
      const { root } = parsePgn(pgnInput);
      if (root.children.length === 0) {
        setError("This PGN has no moves.");
        return;
      }
      setError(null);
      onLoadPgn(pgnInput);
    } catch (err) {
      setError(err instanceof PgnParseError ? err.message : "Invalid PGN format");
    }
  }, [pgnInput, onLoadPgn]);

  const handleClear = useCallback(() => {
    setPgnInput("");
    setError(null);
  }, []);

  return {
    pgnInput,
    error,
    handleInputChange,
    handleLoadPgn,
    handleClear,
  };
};
