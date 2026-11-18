import { describe, expect, it } from "vitest";
import type { StudyNode, StudyRoomSnapshot, StudyState } from "../types";
import {
  applyStudyMessage,
  endOfLine,
  isInVariation,
  mainLineAt,
  pathTo,
  sameShapes,
  toAnalysisTree,
  toStudyPgn,
  toBoardShapes,
  toStudyShapes,
} from "./studyState";
import { parseStartInput } from "./startInput";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const node = (id: string, parentId: string | null, san: string | null, uci: string | null, ply: number, children: string[] = [], comment = ""): StudyNode => ({
  id,
  parentId,
  san,
  uci,
  fen: id === "root" ? START : `fen-${id}`,
  ply,
  children,
  comment,
  shapes: [],
});

/** 1. e4 (1. d4 d5) 1... e5 2. Nf3 */
const tree = (): StudyState => ({
  nodes: {
    root: node("root", null, null, null, 0, ["n1", "n4"]),
    n1: node("n1", "root", "e4", "e2e4", 1, ["n2"]),
    n2: node("n2", "n1", "e5", "e7e5", 2, ["n3"]),
    n3: node("n3", "n2", "Nf3", "g1f3", 3),
    n4: node("n4", "root", "d4", "d2d4", 1, ["n5"], "Queen's pawn"),
    n5: node("n5", "n4", "d5", "d7d5", 2),
  },
  cursor: "root",
  nextId: 6,
});

const snapshot = (version = 3): StudyRoomSnapshot => ({
  room: { id: 1, name: "Room", ownerId: 1, createdAt: "", updatedAt: "", version },
  state: tree(),
  members: [],
  present: [1],
});

describe("applyStudyMessage", () => {
  it("applies the next version and ignores old ones", () => {
    const next = applyStudyMessage(snapshot(), { type: "cursor", cursor: "n2", version: 4, by: 2 });
    expect(next.needsSync).toBe(false);
    expect(next.snapshot?.state.cursor).toBe("n2");
    expect(next.snapshot?.room.version).toBe(4);

    const stale = applyStudyMessage(next.snapshot, { type: "cursor", cursor: "n3", version: 4, by: 2 });
    expect(stale.snapshot).toBe(next.snapshot);
  });

  it("asks for the room again after a gap", () => {
    const gap = applyStudyMessage(snapshot(), { type: "cursor", cursor: "n2", version: 6, by: 2 });
    expect(gap.needsSync).toBe(true);
    expect(gap.snapshot?.state.cursor).toBe("root");
    // A cursor on a node we don't know about
    const unknown = applyStudyMessage(snapshot(), { type: "cursor", cursor: "n99", version: 4, by: 2 });
    expect(unknown.needsSync).toBe(true);
    expect(applyStudyMessage(null, { type: "cursor", cursor: "n2", version: 1, by: 2 }).needsSync).toBe(true);
  });

  it("adds a move under its parent and moves the cursor onto it", () => {
    const added = node("n6", "n3", "Nc6", "b8c6", 4);
    const next = applyStudyMessage(snapshot(), { type: "node_added", node: added, cursor: "n6", version: 4, by: 2 });
    expect(next.needsSync).toBe(false);
    expect(next.snapshot?.state.nodes.n3?.children).toEqual(["n6"]);
    expect(next.snapshot?.state.nodes.n6).toEqual(added);
    expect(next.snapshot?.state.cursor).toBe("n6");
    // Under a parent we don't know: our tree is behind
    const orphan = applyStudyMessage(snapshot(), {
      type: "node_added",
      node: node("n7", "n99", "a3", "a2a3", 1),
      cursor: "n7",
      version: 4,
      by: 2,
    });
    expect(orphan.needsSync).toBe(true);
  });

  it("deletes a node with everything after it", () => {
    const next = applyStudyMessage(snapshot(), {
      type: "node_deleted",
      nodeId: "n1",
      parentId: "root",
      cursor: "root",
      version: 4,
      by: 2,
    });
    expect(Object.keys(next.snapshot!.state.nodes).sort()).toEqual(["n4", "n5", "root"]);
    expect(next.snapshot?.state.nodes.root?.children).toEqual(["n4"]);
    expect(next.snapshot?.state.cursor).toBe("root");
    expect(
      applyStudyMessage(snapshot(), { type: "node_deleted", nodeId: "n99", parentId: "root", cursor: "root", version: 4, by: 2 })
        .needsSync
    ).toBe(true);
  });

  it("reorders a node's children, if they are the ones we have", () => {
    const next = applyStudyMessage(snapshot(), { type: "children", parentId: "root", children: ["n4", "n1"], version: 4, by: 2 });
    expect(next.snapshot?.state.nodes.root?.children).toEqual(["n4", "n1"]);
    const other = applyStudyMessage(snapshot(), { type: "children", parentId: "root", children: ["n4", "n9"], version: 4, by: 2 });
    expect(other.needsSync).toBe(true);
  });

  it("updates one node, presence, members and the name", () => {
    let s = applyStudyMessage(snapshot(), {
      type: "node",
      node: { ...tree().nodes.n1!, comment: "Best by test" },
      version: 4,
      by: 1,
    }).snapshot;
    expect(s?.state.nodes.n1?.comment).toBe("Best by test");
    s = applyStudyMessage(s, { type: "presence", userIds: [1, 2] }).snapshot;
    s = applyStudyMessage(s, { type: "room_renamed", name: "Openings" }).snapshot;
    expect(s?.present).toEqual([1, 2]);
    expect(s?.room.name).toBe("Openings");
  });
});

describe("tree helpers", () => {
  it("walks paths and lines", () => {
    const state = tree();
    expect(pathTo(state, "n3")).toEqual(["n1", "n2", "n3"]);
    expect(pathTo(state, "root")).toEqual([]);
    expect(endOfLine(state, "root")).toBe("n3");
    expect(isInVariation(state, "n5")).toBe(true);
    expect(isInVariation(state, "n3")).toBe(false);
    expect(mainLineAt(state, "n5")).toBe("n2");
  });

  it("converts to the analysis tree shape", () => {
    const root = toAnalysisTree(tree());
    expect(root.children.map((c) => c.move?.san)).toEqual(["e4", "d4"]);
    expect(root.children[0]!.move).toEqual({ san: "e4", uci: "e2e4", from: "e2", to: "e4" });
    expect(root.children[0]!.children[0]!.children[0]!.id).toBe("n3");
  });

  it("writes PGN with variations and comments", () => {
    const state = tree();
    state.nodes.root!.comment = "A {review}";
    expect(toStudyPgn(state)).toBe("{A review} 1. e4 (1. d4 {Queen's pawn} 1... d5) 1... e5 2. Nf3 *");
    expect(toStudyPgn(state, { Event: "Study" })).toMatch(/^\[Event "Study"\]\n\n/);
  });
});

describe("shapes", () => {
  it("keeps the four room brushes and compares regardless of order", () => {
    const shapes = toStudyShapes([
      { orig: "e2", dest: "e4", brush: "green" },
      { orig: "d4", dest: "d4", brush: "red" },
      { orig: "a1", brush: "paleBlue" },
    ]);
    expect(shapes).toEqual([
      { orig: "e2", dest: "e4", brush: "green" },
      { orig: "d4", brush: "red" },
    ]);
    expect(sameShapes(shapes, [...shapes].reverse())).toBe(true);
    expect(sameShapes(shapes, shapes.slice(1))).toBe(false);
  });
});

describe("toBoardShapes", () => {
  it("passes only checked squares and room brushes to the board", () => {
    expect(
      toBoardShapes([
        { orig: "e2", dest: "e4", brush: "green" },
        { orig: "d4", brush: "red" },
        { orig: "d4", dest: "d4", brush: "blue" },
        {
          orig: "a1",
          brush: "yellow",
          customSvg: { html: "<img src=x onerror=alert(1)>" },
          label: { text: "<b>hi</b>" },
          modifiers: { lineWidth: 99 },
        },
      ])
    ).toEqual([
      { orig: "e2", dest: "e4", brush: "green" },
      { orig: "d4", brush: "red" },
      { orig: "d4", brush: "blue" },
      { orig: "a1", brush: "yellow" },
    ]);
  });

  it("drops shapes with bad squares or brushes, and anything that isn't a list", () => {
    expect(
      toBoardShapes([
        { orig: "i9", brush: "green" },
        { orig: "e2", dest: "e9", brush: "green" },
        { orig: "e2", dest: 5, brush: "green" },
        { orig: "e2", brush: "paleBlue" },
        { orig: "e2" },
        { orig: "<svg>", brush: "red" },
        null,
        "e2e4",
      ])
    ).toEqual([]);
    expect(toBoardShapes(undefined)).toEqual([]);
    expect(toBoardShapes({ orig: "e2", brush: "green" })).toEqual([]);
  });
});

describe("parseStartInput", () => {
  it("accepts nothing, a FEN or moves", () => {
    expect(parseStartInput("  ")).toEqual({ ok: true });
    expect(parseStartInput("8/8/8/4k3/8/8/4P3/4K3 w - - 0 1")).toEqual({
      ok: true,
      fen: "8/8/8/4k3/8/8/4P3/4K3 w - - 0 1",
    });
    expect(parseStartInput("1. e4 e5 (1... c5) 2. Nf3 *")).toEqual({ ok: true, moves: ["e4", "e5", "Nf3"] });
  });

  it("explains bad input", () => {
    expect(parseStartInput("8/8/8/8/8/8/8/8 w - - 0 1")).toMatchObject({ ok: false });
    expect(parseStartInput("1. e4 e4")).toMatchObject({ ok: false });
    expect(parseStartInput("hello")).toMatchObject({ ok: false });
  });
});

describe("activityMessage", () => {
  it("names who did what", async () => {
    const { activityMessage } = await import("./activity");
    const before = { ...snapshot(), members: [{ id: 2, username: "bob", avatarUrl: null }] };
    const state = tree();
    state.nodes.n6 = node("n6", "n3", "Nc6", "b8c6", 4);
    state.nodes.n3!.children = ["n6"];
    state.cursor = "n6";
    const after = { ...before, state };
    expect(
      activityMessage(before, after, { type: "node_added", node: state.nodes.n6!, cursor: "n6", version: 4, by: 2 })
    ).toBe("bob played 2... Nc6");
    expect(
      activityMessage(before, after, { type: "node_deleted", nodeId: "n4", parentId: "root", cursor: "root", version: 4, by: 2 })
    ).toBe("bob deleted a variation");
    expect(
      activityMessage(before, { ...before, state: { ...before.state, cursor: "n3" } }, { type: "cursor", cursor: "n3", version: 4, by: 2 })
    ).toBe("bob went to 2. Nf3");
  });
});
