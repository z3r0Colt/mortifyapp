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
    <div className="card sunk fade">
      <label style={{ marginTop: 0 }}>
        {parent ? "Reply" : "Encouragement"}
        <textarea
          value={body}
          maxLength={500}
          onChange={(e) => setBody(e.target.value)}
          style={{ minHeight: 120 }}
        />
      </label>
      <p className="hint">{body.length}/500 · Plain text; links are removed.</p>
      <div className="stack">
        <Action
          className="primary"
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
    </div>
  );
}
