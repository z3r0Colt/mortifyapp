import { useState } from "react";
import { Action } from "./Action";
import { sendMessage } from "../brethren/messages";
import { useMessages } from "../state/messages";
export function MessageComposer({
  receiver,
  parent,
}: {
  receiver: string;
  parent?: string;
}) {
  const [body, setBody] = useState("");
  return (
    <div className="card">
      <label>
        {parent ? "Reply" : "Encouragement"}
        <textarea
          value={body}
          maxLength={500}
          onChange={(e) => setBody(e.target.value)}
        />
      </label>
      <small>{body.length}/500 · Plain text; links are removed.</small>
      <Action
        run={async () => {
          if (!body.trim()) throw new Error("Write a short message.");
          await sendMessage(
            receiver,
            parent ? "reply" : "encouragement",
            body,
            parent,
          );
          setBody("");
          await useMessages.getState().load();
        }}
      >
        Send {parent ? "reply" : "encouragement"}
      </Action>
    </div>
  );
}
