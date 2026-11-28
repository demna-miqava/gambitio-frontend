import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import tableJson from "./data/openings.json?raw";
import { fenFromPositionKey, searchOpenings } from "./searchOpenings";
import type { OpeningTable } from "./openings";
import { playablePositionFromFen } from "@/features/board-editor/utils/editorPosition";

const table: OpeningTable = JSON.parse(tableJson);

describe("fenFromPositionKey", () => {
  it("gives castling rights to kings and rooks on their home squares", () => {
    expect(fenFromPositionKey("rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w")).toBe(
      "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1"
    );
    // White has castled; Black's queen's rook has left a8
    expect(fenFromPositionKey("1rbqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQ1RK1 b")).toBe(
      "1rbqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQ1RK1 b k - 0 1"
    );
    expect(fenFromPositionKey("4k3/8/8/8/8/8/8/4K3 w")).toBe("4k3/8/8/8/8/8/8/4K3 w - - 0 1");
  });

  it("makes a position the analysis board accepts, for every opening in the table", () => {
    const keys = Object.keys(table);
    expect(keys.length).toBeGreaterThan(3000);
    for (const key of keys) {
      const fen = fenFromPositionKey(key);
      expect(() => new Chess(fen), key).not.toThrow();
    }
    // A sample through the page's own check (it is slower)
    for (let i = 0; i < keys.length; i += 97) {
      expect(playablePositionFromFen(fenFromPositionKey(keys[i])), keys[i]).not.toBeNull();
    }
  });
});

describe("searchOpenings", () => {
  const names = (query: string, limit?: number) => searchOpenings(table, query, limit).map((o) => o.name);

  it("finds a main line by the start of its name, before its variations", () => {
    expect(names("sicilian")[0]).toBe("Sicilian Defense");
    expect(names("Sicilian Defense: Najdorf")[0]).toBe("Sicilian Defense: Najdorf Variation");
  });

  it("matches every word, each as the start of a word, in any order", () => {
    expect(names("sic naj")[0]).toBe("Sicilian Defense: Najdorf Variation");
    expect(names("najdorf sicilian")[0]).toBe("Sicilian Defense: Najdorf Variation");
    expect(names("zzzz")).toEqual([]);
  });

  it("ignores accents, apostrophes and case", () => {
    expect(names("grunfeld")[0]).toBe("Grünfeld Defense");
    // The shorter name first: the Attack, then the Defense
    expect(names("KINGS indian").slice(0, 2)).toEqual(["King's Indian Attack", "King's Indian Defense"]);
  });

  it("finds an ECO code", () => {
    const found = searchOpenings(table, "b90");
    expect(found.length).toBeGreaterThan(0);
    expect(found.every((o) => o.eco === "B90")).toBe(true);
  });

  it("keeps to the limit, lists a name once, and needs two characters", () => {
    expect(names("defense", 3)).toHaveLength(3);
    const all = names("ruy lopez", 50);
    expect(new Set(all).size).toBe(all.length);
    expect(names("s")).toEqual([]);
  });
});
