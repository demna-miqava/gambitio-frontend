/**
 * localStorage that belongs to the signed-in account. Entries are stored as
 *   gambitio:u:<account id>:<kind>:<key>
 * so another account signing in on the same browser never sees them, signing
 * out (or deleting the account) removes them all (clearUserStorage), and
 * each kind keeps only its most recently written entries.
 *
 * Every access is wrapped: with storage blocked or full the app works the
 * same, it just doesn't remember.
 */

const ROOT = "gambitio:u:";
export const DEFAULT_MAX_ENTRIES = 50;

/** Clerk's id of the signed-in account, or null. Set by ClerkProviderWithRoutes. */
let currentAccount: string | null = null;

export const setStorageAccount = (accountId: string | null | undefined) => {
  currentAccount = accountId || null;
};

export const getStorageAccount = () => currentAccount;

const accountPrefix = (accountId: string) => `${ROOT}${accountId}:`;

type GetStorage = () => Storage;
const browserStorage: GetStorage = () => localStorage;

const keysWithPrefix = (storage: Storage, prefix: string): string[] => {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key?.startsWith(prefix)) keys.push(key);
  }
  return keys;
};

const removeAll = (storage: Storage, keys: string[]) => {
  for (const key of keys) storage.removeItem(key);
};

/** Removes everything stored for this account (on sign-out and account deletion). */
export const clearUserStorage = (
  accountId: string | null | undefined,
  getStorage: GetStorage = browserStorage
) => {
  if (!accountId) return;
  try {
    const storage = getStorage();
    removeAll(storage, keysWithPrefix(storage, accountPrefix(accountId)));
  } catch {
    // Storage disabled: nothing was saved either
  }
};

export interface UserStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

interface UserStoreOptions {
  /** Entries kept per account; writing more drops the least recently written */
  maxEntries?: number;
  /**
   * Where this kind used to be stored for everyone alike (before entries
   * were per account). Those entries can't be told apart by account, so
   * they're dropped the first time the store is used.
   */
  legacyPrefix?: string;
  /** For tests */
  getStorage?: GetStorage;
  getAccount?: () => string | null;
}

/**
 * A per-account store for one kind of entry (e.g. "analysis"). With nobody
 * signed in, reads find nothing and writes are skipped.
 */
export const userStore = (
  kind: string,
  {
    maxEntries = DEFAULT_MAX_ENTRIES,
    legacyPrefix,
    getStorage = browserStorage,
    getAccount = getStorageAccount,
  }: UserStoreOptions = {}
): UserStore => {
  if (kind === "index" || kind.includes("\n")) throw new Error(`Invalid storage kind "${kind}"`);
  let legacyDropped = !legacyPrefix;

  /** Storage and this account's key prefix for the kind, or null when there's none */
  const open = () => {
    const account = getAccount();
    if (!account) return null;
    const storage = getStorage();
    if (!legacyDropped) {
      legacyDropped = true;
      removeAll(storage, keysWithPrefix(storage, legacyPrefix!));
    }
    return {
      storage,
      dataKey: (key: string) => `${accountPrefix(account)}${kind}:${key}`,
      // Keys of this kind, least recently written first
      indexKey: `${accountPrefix(account)}index:${kind}`,
    };
  };

  const readIndex = (storage: Storage, indexKey: string): string[] => {
    try {
      const parsed: unknown = JSON.parse(storage.getItem(indexKey) ?? "[]");
      return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === "string") : [];
    } catch {
      return [];
    }
  };

  return {
    get(key) {
      try {
        const store = open();
        return store ? store.storage.getItem(store.dataKey(key)) : null;
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        const store = open();
        if (!store) return;
        const { storage, dataKey, indexKey } = store;
        const index = readIndex(storage, indexKey).filter((k) => k !== key);
        index.push(key);
        const evicted = index.splice(0, Math.max(0, index.length - maxEntries));
        removeAll(storage, evicted.map(dataKey));
        storage.setItem(indexKey, JSON.stringify(index));
        storage.setItem(dataKey(key), value);
      } catch {
        // Storage full or disabled: this entry just isn't kept
      }
    },
    remove(key) {
      try {
        const store = open();
        if (!store) return;
        const { storage, dataKey, indexKey } = store;
        storage.removeItem(dataKey(key));
        const index = readIndex(storage, indexKey);
        if (index.includes(key)) {
          storage.setItem(indexKey, JSON.stringify(index.filter((k) => k !== key)));
        }
      } catch {
        // ignore
      }
    },
  };
};
