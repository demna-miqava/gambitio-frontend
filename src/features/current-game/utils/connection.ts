/**
 * Which players are away from a live game, kept on this device's clock.
 *
 * The server says when a player's last connection to the game closed and
 * when they came back. A reload or a network blip is both within a couple
 * of seconds, so a player only counts as away once they have been gone for
 * AWAY_GRACE_MS: nothing flickers beside their name. From claimAfterMs the
 * opponent may claim the win.
 */

/** Gone for less than this isn't shown: a reload comes back sooner */
export const AWAY_GRACE_MS = 3_000;

export interface AwayPlayers {
  /** By player id: when they left, on this device's clock (ms) */
  goneAt: Readonly<Record<number, number>>;
  /**
   * By player id: the number of the last change taken for them. The server
   * numbers a game's changes in the order they happened, and messages from
   * different servers can arrive out of it: an older one is dropped.
   */
  heardSeq: Readonly<Record<number, number>>;
  /** The number the last full state reflected: for either player, nothing older than it is news */
  stateSeq: number;
  /** How long a player must be away before the win can be claimed; null until the server says */
  claimAfterMs: number | null;
}

export const NOBODY_AWAY: AwayPlayers = { goneAt: {}, heardSeq: {}, stateSeq: 0, claimAfterMs: null };

/**
 * The full state the server sends on (re)connect: who is away as of change
 * number `awaySeq`. It replaces what was known, except for a player whose
 * newer change has already arrived: the socket hears the game's changes
 * from the moment it opens, and one can overtake the state being put
 * together.
 */
export function awayFromState(
  current: AwayPlayers,
  state: {
    away?: { userId: number; goneForMs: number }[];
    awaySeq?: number;
    claimAfterMs?: number;
    isFinished: boolean;
  },
  now: number
): AwayPlayers {
  if (state.isFinished) return NOBODY_AWAY;
  const seq = state.awaySeq ?? 0;
  const goneAt: Record<number, number> = {};
  const heardSeq: Record<number, number> = {};
  // Newer than the state: kept as they are
  for (const [id, heard] of Object.entries(current.heardSeq)) {
    if (heard <= seq) continue;
    heardSeq[Number(id)] = heard;
    if (current.goneAt[Number(id)] !== undefined) goneAt[Number(id)] = current.goneAt[Number(id)];
  }
  for (const { userId, goneForMs } of state.away ?? []) {
    if (heardSeq[userId] === undefined) goneAt[userId] = now - goneForMs;
  }
  return { goneAt, heardSeq, stateSeq: seq, claimAfterMs: state.claimAfterMs ?? current.claimAfterMs };
}

/** A player left or came back. */
export function awayAfterChange(
  current: AwayPlayers,
  change: { userId: number; connected: boolean; seq: number; goneForMs?: number; claimAfterMs?: number },
  now: number
): AwayPlayers {
  const { userId } = change;
  // Older than the last one taken: it happened before, and arrived after
  if (Math.max(current.heardSeq[userId] ?? 0, current.stateSeq) > change.seq) return current;
  const goneAt = { ...current.goneAt };
  if (change.connected) delete goneAt[userId];
  else goneAt[userId] = now - (change.goneForMs ?? 0);
  return {
    ...current,
    goneAt,
    heardSeq: { ...current.heardSeq, [userId]: change.seq },
    claimAfterMs: change.claimAfterMs ?? current.claimAfterMs,
  };
}

export interface AwayStatus {
  /** Away for long enough to say so */
  away: boolean;
  /** Whole seconds until the win can be claimed (0: now); null when it can't be */
  claimInSeconds: number | null;
}

/** How one player stands at `now`. */
export function awayStatus(players: AwayPlayers, userId: number, now: number): AwayStatus {
  const goneAt = players.goneAt[userId];
  if (goneAt === undefined) return { away: false, claimInSeconds: null };
  const goneFor = now - goneAt;
  if (goneFor < AWAY_GRACE_MS) return { away: false, claimInSeconds: null };
  return {
    away: true,
    claimInSeconds:
      players.claimAfterMs === null ? null : Math.max(0, Math.ceil((players.claimAfterMs - goneFor) / 1000)),
  };
}

/** "0:15" */
export const formatCountdown = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
