import { useEffect, useId, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MAX_COMMENT_LENGTH, type StudyClientMessage, type StudyNode } from "../types";
import { studyMoveLabel } from "../utils/activity";

/**
 * The comment on the position everyone is looking at. Saved when the field
 * loses focus or with Save (Ctrl/⌘+Enter), and when someone else moves the
 * room to another position mid-edit. A comment someone else saves replaces
 * the text unless you are editing it.
 */
export const StudyComment = ({
  node,
  send,
}: {
  node: StudyNode;
  send: (message: StudyClientMessage) => void;
}) => {
  const id = useId();
  const [draft, setDraft] = useState(node.comment);
  const [editing, setEditing] = useState(false);
  // Follow the room (another position, or someone else's comment) unless editing
  const [shown, setShown] = useState({ id: node.id, comment: node.comment });
  if (shown.id !== node.id || (!editing && shown.comment !== node.comment)) {
    setShown({ id: node.id, comment: node.comment });
    setDraft(node.comment);
  }
  const changed = draft.trim() !== node.comment;

  // The room moved on while a change was unsaved: it goes on the position it
  // was written for, instead of being dropped. (Declared before the effect
  // below, so it still sees the previous position's draft.)
  const unsavedRef = useRef<{ nodeId: string; text: string } | null>(null);
  useEffect(() => {
    const unsaved = unsavedRef.current;
    if (unsaved && unsaved.nodeId !== node.id) {
      send({ type: "comment", nodeId: unsaved.nodeId, text: unsaved.text });
    }
  }, [node.id, send]);
  useEffect(() => {
    unsavedRef.current =
      editing && changed ? { nodeId: node.id, text: draft.slice(0, MAX_COMMENT_LENGTH) } : null;
  }, [editing, changed, node.id, draft]);

  const save = () => {
    if (changed) send({ type: "comment", nodeId: node.id, text: draft.slice(0, MAX_COMMENT_LENGTH) });
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        Comment on {studyMoveLabel(node)}
      </label>
      <Textarea
        id={id}
        value={draft}
        maxLength={MAX_COMMENT_LENGTH}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => setEditing(true)}
        onBlur={() => {
          setEditing(false);
          save();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            save();
          }
        }}
        placeholder="Add a note for everyone in the room"
        className="max-h-32 min-h-14 text-sm"
      />
      {changed && editing && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs tabular-nums text-muted-foreground">
            {draft.length}/{MAX_COMMENT_LENGTH}
          </span>
          {/* onMouseDown: save before the field's blur moves focus */}
          <Button size="sm" onMouseDown={(e) => e.preventDefault()} onClick={save}>
            Save
          </Button>
        </div>
      )}
    </div>
  );
};
