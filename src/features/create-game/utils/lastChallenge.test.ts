import { describe, expect, it, vi } from "vitest";
import { createLastChallengeStore, parseLastChallenge, type LastChallenge } from "./lastChallenge";
import type { UserStore } from "@/utils/userStorage";

const memoryStore = (): UserStore & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return {
    data,
    get: (key) => data.get(key) ?? null,
    set: (key, value) => void data.set(key, value),
    remove: (key) => void data.delete(key),
  };
};

const terms: LastChallenge = { time: 300, increment: 2, color: "white", rated: false };

describe("parseLastChallenge", () => {
  it("reads what was saved", () => {
    expect(parseLastChallenge(JSON.stringify(terms))).toEqual(terms);
  });

  it("is null for nothing, garbage, or values no challenge could have", () => {
    expect(parseLastChallenge(null)).toBeNull();
    expect(parseLastChallenge("")).toBeNull();
    expect(parseLastChallenge("{not json")).toBeNull();
    expect(parseLastChallenge("null")).toBeNull();
    expect(parseLastChallenge(JSON.stringify([300, 0]))).toBeNull();
    for (const bad of [
      { time: 0 },
      { time: -60 },
      { time: 90.5 },
      { time: "300" },
      { time: 10 ** 9 },
      { increment: -1 },
      { increment: 1.5 },
      { color: "green" },
      { color: undefined },
      { rated: "yes" },
    ]) {
      expect(parseLastChallenge(JSON.stringify({ ...terms, ...bad }))).toBeNull();
    }
  });

  it("keeps only the terms", () => {
    expect(parseLastChallenge(JSON.stringify({ ...terms, openingId: "sicilian" }))).toEqual(terms);
  });
});

describe("createLastChallengeStore", () => {
  it("is null before the first challenge, then the last one saved", () => {
    const store = createLastChallengeStore(memoryStore());
    expect(store.read()).toBeNull();
    store.save(terms);
    expect(store.read()).toEqual(terms);
    store.save({ ...terms, time: 60 });
    expect(store.read()).toEqual({ ...terms, time: 60 });
  });

  it("returns the same object while nothing changed", () => {
    const store = createLastChallengeStore(memoryStore());
    store.save(terms);
    expect(store.read()).toBe(store.read());
  });

  it("tells subscribers about a save, until they unsubscribe", () => {
    const store = createLastChallengeStore(memoryStore());
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.save(terms);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.save(terms);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("follows the underlying storage, e.g. another account signing in", () => {
    const backing = memoryStore();
    const store = createLastChallengeStore(backing);
    store.save(terms);
    backing.data.clear();
    expect(store.read()).toBeNull();
  });
});
