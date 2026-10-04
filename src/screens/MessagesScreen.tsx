import { useEffect, useRef, useState } from "react";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { Icon } from "../components/Icon";
import { Initial } from "../components/BrotherCard";
import { MessageCard } from "../components/MessageCard";
import { MessageComposer } from "../components/MessageComposer";
import { useMessages } from "../state/messages";
import { useBrethren } from "../state/brethren";
import { useAuth } from "../state/auth";
import { cloud, result } from "../brethren/client";
export default function MessagesScreen() {
  const { rows, error, load } = useMessages();
  const { peers, profile } = useBrethren();
  const user = useAuth((s) => s.user);
  const [compose, setCompose] = useState("");
  const [, refreshTime] = useState(0);
  // Opening Messages marks what you received as read. Those messages still
  // show as new until you leave, so nothing slips past unseen.
  const [fresh] = useState(() => new Set<string>());
  const marking = useRef(new Set<string>());
  useEffect(() => {
    const unread = rows.filter(
      (m) =>
        m.receiver_id === user?.id && !m.read && !marking.current.has(m.id),
    );
    if (!unread.length) return;
    for (const m of unread) {
      marking.current.add(m.id);
      fresh.add(m.id);
    }
    void Promise.all(
      unread.map(async (m) =>
        result(cloud().rpc("mark_message_read", { p_message: m.id })),
      ),
    )
      .then(() => useMessages.getState().load())
      .catch(() => {});
  }, [rows, user?.id]);
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
  const sister = profile?.sex === "sister";
  return (
    <Page
      title="Messages"
      back={{ to: "/brethren", label: sister ? "Sisters" : "Brethren" }}
      lede={`Keep messages short. Make room for prayer and real conversation with your ${sister ? "sisters" : "brethren"}.`}
    >
      {error && <p role="alert">{error}</p>}
      {active.length > 0 && (
        <>
          <h2 className="section-title">Prayer requests</h2>
          {active.map((m) => (
            <div key={m.id}>
              <h3>
                {m.sender_id === user?.id
                  ? "Your request"
                  : peers.find((p) => p.id === m.sender_id)?.display_name}
              </h3>
              <MessageCard message={m} fresh={fresh.has(m.id)} />
            </div>
          ))}
        </>
      )}
      <h2 className="section-title">Send encouragement</h2>
      <label>
        <span className="visually-hidden">Send encouragement</span>
        <select value={compose} onChange={(e) => setCompose(e.target.value)}>
          <option value="">Choose a {sister ? "sister" : "brother"}</option>
          {peers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.display_name}
            </option>
          ))}
        </select>
      </label>
      {compose && <MessageComposer receiver={compose} />}
      {!rows.length && <p className="label">No messages yet.</p>}
      {groups.map((group) => (
        <section key={group.peer.id}>
          <h2 className="person" style={{ marginTop: "2.4rem" }}>
            <Initial name={group.peer.display_name} />
            {group.peer.display_name}
          </h2>
          {group.messages.map((m) => (
            <MessageCard key={m.id} message={m} fresh={fresh.has(m.id)} />
          ))}
        </section>
      ))}
      <Action className="quiet" run={load}>
        <Icon name="refresh" size={16} />
        Refresh messages
      </Action>
    </Page>
  );
}
