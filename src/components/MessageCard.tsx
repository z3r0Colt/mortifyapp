import { useState } from "react";
import { Action } from "./Action";
import { Icon } from "./Icon";
import { MessageComposer } from "./MessageComposer";
import { messageText, sendMessage, type Message } from "../brethren/messages";
import { useAuth } from "../state/auth";
import { useMessages } from "../state/messages";
import { useApp } from "../state/app";
import { cloud, result } from "../brethren/client";
import { useBrethren } from "../state/brethren";
export function MessageCard({
  message,
  fresh = false,
}: {
  message: Message;
  /** Unread when the screen was opened, so it still shows as new. */
  fresh?: boolean;
}) {
  const user = useAuth((s) => s.user);
  const rows = useMessages((s) => s.rows);
  const [reply, setReply] = useState(false);
  const [menu, setMenu] = useState(false);
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
  const praying = replies.some(
    (r) => r.message_type === "praying" && r.sender_id === user?.id,
  );
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
    <article className={`card${activePrayer ? " prayer-card accent" : ""}`}>
      <div className="message-meta">
        <span className="label">
          {outgoing ? "You sent" : "Received"} ·{" "}
          {new Date(message.created_at).toLocaleString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
        <span className="row">
          {!outgoing && (fresh || !message.read) && (
            <span className="dot" aria-label="New" />
          )}
          {!outgoing && (
            <button
              className="icon-button small"
              aria-label="More options for this message"
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              <Icon name="more" size={18} />
            </button>
          )}
        </span>
      </div>
      {menu && (
        <div className="stack fade" style={{ marginBottom: 12 }}>
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
        </div>
      )}
      <p className="message-body">{messageText(message)}</p>
      {battle && <span className="tag">{battle}</span>}
      {message.message_type === "pray_for_me" && outgoing && (
        <p className="label" style={{ marginTop: 10 }}>
          {prayingCount} praying
        </p>
      )}
      <div className="message-actions">
        {message.message_type === "pray_for_me" && !outgoing && praying && (
          <span className="label">You are praying for this</span>
        )}
        {message.message_type === "pray_for_me" && !outgoing && !praying && (
          <Action
            className="primary"
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
        {message.message_type === "pray_for_me" &&
          outgoing &&
          !message.answered_at && (
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
        <button aria-expanded={reply} onClick={() => setReply(!reply)}>
          Reply
        </button>
      </div>
      {reply && <MessageComposer receiver={other} parent={message.id} />}
      {replies.length > 0 && (
        <div className="thread">
          {replies.map((r) => (
            <p key={r.id}>
              <small>
                {r.sender_id === user?.id ? "You" : "Reply"} ·{" "}
                {new Date(r.created_at).toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </small>
              <br />
              {messageText(r)}
            </p>
          ))}
        </div>
      )}
    </article>
  );
}
