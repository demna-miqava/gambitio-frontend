/**
 * Whether a close event belongs to the search that is running now.
 *
 * react-use-websocket closes a replaced socket without unbinding its
 * handlers, so close events of older sockets still arrive. A close counts
 * only when a search is running, the socket isn't the one left over from an
 * earlier search, and it is still the hook's current socket.
 */
export const isCurrentSearchSocket = <S>(
  session: { previousSocket: S | null } | null,
  closedSocket: S | null,
  currentSocket: S | null
): boolean =>
  session !== null &&
  closedSocket !== null &&
  closedSocket !== session.previousSocket &&
  closedSocket === currentSocket;
