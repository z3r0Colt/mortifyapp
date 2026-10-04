import { useState } from "react";
import { Link } from "react-router-dom";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { BrotherCard } from "../components/BrotherCard";
import { useBrethren } from "../state/brethren";
import { cloud, result } from "../brethren/client";
import { useMessages } from "../state/messages";
export default function BrethrenScreen() {
  const { profile, peers, requests, load } = useBrethren();
  const unread = useMessages(
    (s) =>
      s.rows.filter((m) => !m.read && m.receiver_id === profile?.id).length,
  );
  const [copied, setCopied] = useState(false);
  if (!profile) return null;
  const circle = profile.sex === "sister" ? "sisters" : "brethren";
  return (
    <Page title={profile.sex === "sister" ? "Sisters" : "Brethren"}>
      <p>
        Share your code privately with believers you know, especially in your
        own local church.
      </p>
      <article className="card">
        <small>Your private code</small>
        <p className="code">{profile.brethren_code}</p>
        <Action
          run={async () => {
            const text = `My Mortify ${circle} code is ${profile.brethren_code}.`;
            if (navigator.share)
              await navigator.share({ title: "Mortify code", text });
            else {
              await navigator.clipboard.writeText(text);
              setCopied(true);
            }
          }}
        >
          Share code
        </Action>
        {copied && <p role="status">Code copied. You may send it by text.</p>}
      </article>
      <div className="stack">
        <Link className="button" to="/brethren/messages">
          Messages{" "}
          {unread > 0 && <span className="dot" aria-label="Unread messages" />}
        </Link>
        <Link className="button" to="/brethren/add">
          Add by code
        </Link>
        <Link className="button" to="/brethren/sharing">
          What I share
        </Link>
        <Link className="button" to="/brethren/preview">
          What my brethren see
        </Link>
        <Link className="button" to="/brethren/contact">
          Phone for my circle
        </Link>
        <Link className="button" to="/notifications">
          Notifications
        </Link>
      </div>
      {requests.length > 0 && <h2>Requests</h2>}
      {requests.map((r) => (
        <article className="card" key={r.link_id}>
          <h2>{r.display_name}</h2>
          <p>{r.church_name}</p>
          <div className="row">
            <Action
              run={async () => {
                await result(
                  cloud().rpc("respond_link", {
                    p_link: r.link_id,
                    p_accept: true,
                  }),
                );
                await load();
              }}
            >
              Accept
            </Action>
            <Action
              run={async () => {
                await result(
                  cloud().rpc("respond_link", {
                    p_link: r.link_id,
                    p_accept: false,
                  }),
                );
                await load();
              }}
            >
              Decline
            </Action>
          </div>
        </article>
      ))}
      <h2>Your {circle}</h2>
      {peers.length ? (
        peers.map((peer) => <BrotherCard key={peer.id} peer={peer} />)
      ) : (
        <p>No accepted links yet. Share your code with someone you know.</p>
      )}
      <Action run={load}>Refresh circle</Action>
    </Page>
  );
}
