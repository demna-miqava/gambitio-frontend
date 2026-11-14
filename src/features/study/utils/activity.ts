import type { StudyNode, StudyRoomSnapshot, StudyServerMessage } from "../types";
import { nodeOf } from "./studyState";

/** "12. Nf3" / "12... Nf6", or "the starting position". */
export function studyMoveLabel(node: StudyNode | undefined): string {
  if (!node?.san) return "the starting position";
  const number = Math.floor((node.ply - 1) / 2) + 1;
  return `${number}${(node.ply - 1) % 2 === 0 ? "." : "..."} ${node.san}`;
}

/**
 * What someone else just did, for screen readers and the activity line:
 * "Bob played 3. Bb5". Null when there's nothing worth saying.
 */
export function activityMessage(
  before: StudyRoomSnapshot,
  after: StudyRoomSnapshot,
  message: StudyServerMessage
): string | null {
  if (!("by" in message)) return null;
  const name = after.members.find((m) => m.id === message.by)?.username ?? "Someone";
  const { state } = after;
  switch (message.type) {
    case "node_added":
      return `${name} played ${studyMoveLabel(message.node)}`;
    case "node_deleted":
      return `${name} deleted a variation`;
    case "children":
      return `${name} changed the main line`;
    case "cursor":
      return `${name} went to ${studyMoveLabel(nodeOf(state, message.cursor))}`;
    case "node": {
      const previous = nodeOf(before.state, message.node.id);
      const label = studyMoveLabel(message.node);
      if (previous && previous.comment !== message.node.comment) {
        return message.node.comment ? `${name} commented on ${label}` : `${name} removed the comment on ${label}`;
      }
      return `${name} drew on the board at ${label}`;
    }
    default:
      return null;
  }
}
