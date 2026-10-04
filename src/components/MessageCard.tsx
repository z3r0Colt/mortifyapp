import { useState } from "react";
import { Action } from "./Action";
import { MessageComposer } from "./MessageComposer";
import { messageText, sendMessage, type Message } from "../brethren/messages";
import { useAuth } from "../state/auth";
import { useMessages } from "../state/messages";
import { useApp } from "../state/app";
import { cloud, result } from "../brethren/client";
import { useBrethren } from "../state/brethren";
export function MessageCard({ message }: { message: Message }) {
  const user = useAuth((s) => s.user);
  const rows = useMessages((s) => s.rows);
  const [reply, setReply] = useState(false);
  const outgoing = message.sender_id === user?.id;
  const activePrayer =
    message.message_type === "pray_for_me" &&
    !message.answered_at &&
    Date.now() - Date.parse(message.created_at) < 86400000;
  const other = outgoing ? message.receiver_id : message.sender_id;
  const battle = useApp(
    (s) => s.packs.find((p) => p.id === message.battle_id)?.name,
  );
  const replies = rows.filter((r) => r.parent_message_id === message.id);
  const requestIds = new Set(
    rows
      .filter(
        (r) =>
          r.message_type === "pray_for_me" && r.client_id === message.client_id,
      )
      .map((r) => r.id),
  );
  const prayingCount = new Set(
    rows
      .filter(
        (r) =>
          r.message_type === "praying" &&
          r.parent_message_id &&
          requestIds.has(r.parent_message_id),
      )
      .map((r) => r.sender_id),
  ).size;
  return (
    <article className={`card${activePrayer ? " prayer-card" : ""}`}>
      <p className="label">
        {outgoing ? "You sent" : "Received"} ·{" "}
        {new Date(message.created_at).toLocaleString()}
        {!outgoing && !message.read && (
          <span className="dot" aria-label="Unread" />
        )}
      </p>
      <p>{messageText(message)}</p>
      {battle && <p>{battle}</p>}
      {message.message_type === "pray_for_me" && !outgoing && (
        <Action
          run={async () => {
            await sendMessage(other, "praying", undefined, message.id);
            await result(
              cloud().rpc("mark_message_read", { p_message: message.id }),
            );
            await useMessages.getState().load();
          }}
        >
          I'm praying for you
        </Action>
      )}
      {message.message_type === "pray_for_me" && outgoing && (
        <>
          <p className="label">{prayingCount} praying</p>
          {!message.answered_at && (
            <Action
              run={async () => {
                await result(
                  cloud().rpc("answer_prayer", { p_client: message.client_id }),
                );
                await useMessages.getState().load();
              }}
            >
              Mark answered
            </Action>
          )}
        </>
      )}
      {!outgoing && !message.read && (
        <Action
          run={async () => {
            await result(
              cloud().rpc("mark_message_read", { p_message: message.id }),
            );
            await useMessages.getState().load();
          }}
        >
          Mark read
        </Action>
      )}
      <button onClick={() => setReply(!reply)}>Reply</button>
      {!outgoing && (
        <Action
          run={async () => {
            if (
              window.confirm(
                "Report this message as abusive and remove this person from your circle?",
              )
            ) {
              await result(
                cloud().rpc("report_message", { p_message: message.id }),
              );
              await Promise.all([
                useBrethren.getState().load(),
                useMessages.getState().load(),
              ]);
            }
          }}
        >
          Report abusive message
        </Action>
      )}
      {reply && <MessageComposer receiver={other} parent={message.id} />}
      <div className="thread">
        {replies.map((r) => (
          <p key={r.id}>
            <small>
              {r.sender_id === user?.id ? "You" : "Reply"} ·{" "}
              {new Date(r.created_at).toLocaleTimeString()}
            </small>
            <br />
            {messageText(r)}
          </p>
        ))}
      </div>
    </article>
  );
}
