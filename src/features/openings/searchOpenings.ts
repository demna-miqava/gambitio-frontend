import type { OpeningTable } from "./openings";

export interface FoundOpening {
  eco: string;
  name: string;
  /** A position with this name, as a full FEN (see fenFromPositionKey) */
  fen: string;
}

/**
 * A full FEN for one of the table's positions, which are stored as piece
 * placement and side to move only. Castling rights are taken from where the
 * kings and rooks stand: in a book position a king and rook still on their
 * home squares have almost always not moved. No en passant square, and the
 * move counters start over.
 */
export function fenFromPositionKey(key: string): string {
  const [placement = "", turn = "w"] = key.split(" ");
  const rows = placement.split("/");
  // The piece on a file (0 = a) of a rank given as its FEN row
  const pieceAt = (row: string | undefined, file: number) => {
    let at = 0;
    for (const char of row ?? "") {
      if (char >= "1" && char <= "8") at += Number(char);
      else if (at++ === file) return char;
      if (at > file) return null;
    }
    return null;
  };
  const white = rows[7];
  const black = rows[0];
  const rights =
    (pieceAt(white, 4) === "K" ? (pieceAt(white, 7) === "R" ? "K" : "") + (pieceAt(white, 0) === "R" ? "Q" : "") : "") +
    (pieceAt(black, 4) === "k" ? (pieceAt(black, 7) === "r" ? "k" : "") + (pieceAt(black, 0) === "r" ? "q" : "") : "");
  return `${placement} ${turn} ${rights || "-"} - 0 1`;
}

/** Lower case, accents and punctuation dropped: "Grünfeld" is found by "grunfeld", "King's" by "kings" */
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

interface IndexedOpening extends FoundOpening {
  /** The normalized name, and its words */
  text: string;
  words: string[];
}

const indexes = new WeakMap<OpeningTable, IndexedOpening[]>();

/** One entry per opening name (the first position found with it), built once per table */
function indexOf(table: OpeningTable): IndexedOpening[] {
  let index = indexes.get(table);
  if (!index) {
    const byName = new Map<string, IndexedOpening>();
    for (const key in table) {
      const entry = table[key];
      const tab = entry.indexOf("\t");
      const name = entry.slice(tab + 1);
      if (byName.has(name)) continue;
      const text = normalize(name);
      byName.set(name, {
        eco: entry.slice(0, tab),
        name,
        fen: fenFromPositionKey(key),
        text,
        words: text.split(" "),
      });
    }
    index = [...byName.values()];
    indexes.set(table, index);
  }
  return index;
}

/**
 * Openings whose name has every word of the query (each as the start of one
 * of its words: "sic naj" finds the Sicilian Najdorf), or whose ECO code is
 * the query ("B90"). Best first: a name that starts with the query, then the
 * shortest names, which are the main lines the longer variations hang off.
 */
export function searchOpenings(table: OpeningTable, query: string, limit = 5): FoundOpening[] {
  const text = normalize(query);
  if (text.length < 2) return [];
  const words = text.split(" ");
  const eco = /^[a-e]\d\d$/.test(text) ? text.toUpperCase() : null;
  const matches = indexOf(table).filter(
    (opening) =>
      opening.eco === eco ||
      words.every((word) => opening.words.some((candidate) => candidate.startsWith(word)))
  );
  const starts = (opening: IndexedOpening) => (opening.text.startsWith(text) ? 0 : 1);
  return matches
    .sort((a, b) => starts(a) - starts(b) || a.name.length - b.name.length || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map(({ eco: code, name, fen }) => ({ eco: code, name, fen }));
}
