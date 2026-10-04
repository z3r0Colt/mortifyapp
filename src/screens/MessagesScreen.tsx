import { useEffect, useState } from "react";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { MessageCard } from "../components/MessageCard";
import { MessageComposer } from "../components/MessageComposer";
import { useMessages } from "../state/messages";
import { useBrethren } from "../state/brethren";
import { useAuth } from "../state/auth";
export default function MessagesScreen() {
  const { rows, error, load } = useMessages();
  const { peers, profile } = useBrethren();
  const user = useAuth((s) => s.user);
  const [compose, setCompose] = useState("");
  const [, refreshTime] = useState(0);
  useEffect(() => {
    const delays = rows
      .filter((m) => m.message_type === "pray_for_me" && !m.answered_at)
      .map((m) => Date.parse(m.created_at) + 86400000 - Date.now())
      .filter((delay) => delay > 0);
    if (!delays.length) return;
    const timer = setTimeout(
      () => refreshTime((n) => n + 1),
      Math.min(...delays) + 10,
    );
    return () => clearTimeout(timer);
  });
  const active = rows.filter(
    (m) =>
      m.message_type === "pray_for_me" &&
      !m.answered_at &&
      Date.now() - Date.parse(m.created_at) < 86400000,
  );
  const groups = peers
    .map((peer) => ({
      peer,
      messages: rows.filter(
        (m) =>
          !m.parent_message_id &&
          (m.sender_id === peer.id || m.receiver_id === peer.id) &&
          !active.some((a) => a.id === m.id),
      ),
    }))
    .filter((group) => group.messages.length)
    .sort(
      (a, b) =>
        Date.parse(b.messages[0].created_at) -
        Date.parse(a.messages[0].created_at),
    );
  return (
    <Page title="Messages">
      {error && <p role="alert">{error}</p>}
      <p>
        Keep messages short. Make room for prayer and real conversation with
        your {profile?.sex === "sister" ? "sisters" : "brethren"}.
      </p>
      {active.length > 0 && (
        <>
          <h2>Prayer requests</h2>
          {active.map((m) => (
            <div key={m.id}>
              <h3>
                {m.sender_id === user?.id
                  ? "Your request"
                  : peers.find((p) => p.id === m.sender_id)?.display_name}
              </h3>
              <MessageCard message={m} />
            </div>
          ))}
        </>
      )}
      <label>
        Send encouragement
        <select value={compose} onChange={(e) => setCompose(e.target.value)}>
          <option value="">
            Choose a {profile?.sex === "sister" ? "sister" : "brother"}
          </option>
          {peers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.display_name}
            </option>
          ))}
        </select>
      </label>
      {compose && <MessageComposer receiver={compose} />}
      <Action run={load}>Refresh messages</Action>
      {!rows.length && <p>No messages yet.</p>}
      {groups.map((group) => (
        <section key={group.peer.id}>
          <h2>{group.peer.display_name}</h2>
          {group.messages.map((m) => (
            <MessageCard key={m.id} message={m} />
          ))}
        </section>
      ))}
    </Page>
  );
}
