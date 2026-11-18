import { describe, expect, it } from "vitest";
import { clearUserStorage, userStore } from "./userStorage";

/** A minimal in-memory Storage */
class MemoryStorage implements Storage {
  private items = new Map<string, string>();
  get length() {
    return this.items.size;
  }
  clear() {
    this.items.clear();
  }
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  key(index: number) {
    return [...this.items.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.items.delete(key);
  }
  setItem(key: string, value: string) {
    this.items.set(key, String(value));
  }
  keys() {
    return [...this.items.keys()];
  }
}

const setup = (options: { maxEntries?: number; legacyPrefix?: string } = {}) => {
  const storage = new MemoryStorage();
  let account: string | null = "user_a";
  const store = userStore("analysis", {
    ...options,
    getStorage: () => storage,
    getAccount: () => account,
  });
  return { storage, store, signIn: (id: string | null) => (account = id) };
};

describe("userStore", () => {
  it("keeps each account's entries apart", () => {
    const { storage, store, signIn } = setup();
    store.set("game:1", "a's analysis");
    expect(store.get("game:1")).toBe("a's analysis");
    expect(storage.getItem("gambitio:u:user_a:analysis:game:1")).toBe("a's analysis");

    signIn("user_b");
    expect(store.get("game:1")).toBeNull();
    store.set("game:1", "b's analysis");
    signIn("user_a");
    expect(store.get("game:1")).toBe("a's analysis");
  });

  it("reads nothing and writes nothing with nobody signed in", () => {
    const { storage, store, signIn } = setup();
    signIn(null);
    store.set("game:1", "x");
    expect(store.get("game:1")).toBeNull();
    expect(storage.length).toBe(0);
  });

  it("keeps only the most recently written entries", () => {
    const { store } = setup({ maxEntries: 2 });
    store.set("one", "1");
    store.set("two", "2");
    store.set("one", "1 again"); // now the newest
    store.set("three", "3");
    expect(store.get("two")).toBeNull();
    expect(store.get("one")).toBe("1 again");
    expect(store.get("three")).toBe("3");
  });

  it("removes entries and their place in the index", () => {
    const { storage, store } = setup({ maxEntries: 2 });
    store.set("one", "1");
    store.remove("one");
    expect(store.get("one")).toBeNull();
    expect(storage.getItem("gambitio:u:user_a:index:analysis")).toBe("[]");
  });

  it("drops the old shared entries on first use", () => {
    const { storage, store } = setup({ legacyPrefix: "gambitio:analysis:" });
    storage.setItem("gambitio:analysis:game:1", "someone's");
    storage.setItem("gambitio:puzzle-theme", "kept");
    expect(store.get("game:1")).toBeNull();
    expect(storage.keys()).toEqual(["gambitio:puzzle-theme"]);
  });

  it("survives a damaged index and storage that throws", () => {
    const { storage, store } = setup();
    storage.setItem("gambitio:u:user_a:index:analysis", "{not json");
    store.set("one", "1");
    expect(store.get("one")).toBe("1");

    const broken = userStore("analysis", {
      getAccount: () => "user_a",
      getStorage: () => {
        throw new Error("SecurityError");
      },
    });
    expect(() => broken.set("one", "1")).not.toThrow();
    expect(broken.get("one")).toBeNull();
    expect(() => broken.remove("one")).not.toThrow();
  });
});

describe("clearUserStorage", () => {
  it("removes every entry of that account only", () => {
    const storage = new MemoryStorage();
    const forA = userStore("analysis", { getStorage: () => storage, getAccount: () => "user_a" });
    const reviewsForA = userStore("review:v1", { getStorage: () => storage, getAccount: () => "user_a" });
    const forAb = userStore("analysis", { getStorage: () => storage, getAccount: () => "user_ab" });
    forA.set("game:1", "a");
    reviewsForA.set("game:1:x", "[]");
    forAb.set("game:1", "ab");
    storage.setItem("theme", '"dark"');

    clearUserStorage("user_a", () => storage);
    expect(storage.keys().sort()).toEqual([
      "gambitio:u:user_ab:analysis:game:1",
      "gambitio:u:user_ab:index:analysis",
      "theme",
    ]);
    expect(() => clearUserStorage(null, () => storage)).not.toThrow();
  });
});
