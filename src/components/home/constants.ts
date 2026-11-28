/** How many recent games Home lists at most (it shows as many as fit). */
export const HOME_GAMES_LIMIT = 8;

/**
 * The one request for the player's recent games that Home's parts share
 * (the recent games table, the New game panel's usual time control, whether
 * the account is new): the same options give the same cache entry.
 */
export const HOME_GAMES_QUERY = { defaultLimit: HOME_GAMES_LIMIT, withMoves: true } as const;

/** How many friends the Play a friend panel lists (online first). */
export const HOME_FRIENDS_LIMIT = 5;
