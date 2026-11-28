/**
 * Of the players found for an earlier search, those whose name has `query`
 * in it. Until the answer for what is in the field now arrives, the last
 * answer is what there is to show: typing on keeps the matches that still
 * match (the list doesn't blink), and a different search shows none of the
 * last one's players. An answer to `query` itself passes whole: everything
 * the server finds has the query in its name.
 */
export const stillMatching = <P extends { username: string }>(players: readonly P[], query: string): P[] => {
  const needle = query.trim().toLowerCase();
  return players.filter((player) => player.username.toLowerCase().includes(needle));
};
