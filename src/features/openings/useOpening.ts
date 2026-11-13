import { useEffect, useState } from "react";
import { findOpening, loadOpenings, loadedOpenings, type Opening } from "./openings";

/**
 * The opening of the line `fens` (start position to the one shown), or null
 * while there's none or the table is still loading. The table is fetched
 * the first time a line has a move in it.
 */
export const useOpening = (fens: readonly string[]): Opening | null => {
  const [table, setTable] = useState(loadedOpenings);
  const hasMoves = fens.length > 1;

  useEffect(() => {
    if (table || !hasMoves) return;
    let active = true;
    loadOpenings()
      .then((loaded) => active && setTable(loaded))
      // No name is shown; the next page with moves tries again
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [table, hasMoves]);

  return table && hasMoves ? findOpening(table, fens) : null;
};
