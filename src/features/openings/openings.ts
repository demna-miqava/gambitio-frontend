/**
 * Opening names from the Lichess opening tables (CC0), built into
 * data/openings.json by scripts/build-openings.mjs. The table maps a position
 * (piece placement and side to move) to "ECO<TAB>name", so a transposition
 * finds the same name as the main move order.
 */

export interface Opening {
  eco: string;
  name: string;
}

export type OpeningTable = Readonly<Record<string, string>>;

/** The first two FEN fields: piece placement and side to move */
export const positionKey = (fen: string) => fen.split(" ", 2).join(" ");

/**
 * The opening of the deepest named position along `fens` (start to current),
 * so the name stays once the game leaves the book. Null before any named
 * position.
 */
export function findOpening(table: OpeningTable, fens: readonly string[]): Opening | null {
  for (let i = fens.length - 1; i >= 0; i--) {
    const entry = table[positionKey(fens[i])];
    if (entry) {
      const tab = entry.indexOf("\t");
      return { eco: entry.slice(0, tab), name: entry.slice(tab + 1) };
    }
  }
  return null;
}

// A hashed asset fetched on first use, rather than a module: it's ~430 KB
// (70 KB compressed) that pages without moves never need, and importing the
// JSON would make TypeScript type all 3,800 entries.
const TABLE_URL = new URL("./data/openings.json", import.meta.url);

let cached: OpeningTable | null = null;
let pending: Promise<OpeningTable> | null = null;

/** The table if it has been loaded already */
export const loadedOpenings = () => cached;

/** Loads the table once; a failed load is retried on the next call */
export const loadOpenings = (): Promise<OpeningTable> =>
  (pending ??= fetch(TABLE_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`Opening table: HTTP ${response.status}`);
      return response.json() as Promise<OpeningTable>;
    })
    .then((table) => (cached = table))
    .catch((error) => {
      pending = null;
      throw error;
    }));
