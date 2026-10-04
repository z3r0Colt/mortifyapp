import { useState } from "react";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { Icon } from "../components/Icon";
import { ListGroup, ListLink } from "../components/List";
import { BrotherCard, Initial } from "../components/BrotherCard";
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
    <Page
      title={profile.sex === "sister" ? "Sisters" : "Brethren"}
      lede="Share your code privately with believers you know, especially in your own local church."
    >
      <article className="card code-card accent">
        <p className="eyebrow">Your private code</p>
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
          <Icon name="share" size={18} />
          Share code
        </Action>
        {copied && <p role="status">Code copied. You may send it by text.</p>}
      </article>
      {requests.length > 0 && (
        <>
          <h2 className="section-title">Requests</h2>
          {requests.map((r) => (
            <article className="card fade" key={r.link_id}>
              <div className="person">
                <Initial name={r.display_name} />
                <span className="row-text">
                  <strong>{r.display_name}</strong>
                  {r.church_name && <span>{r.church_name}</span>}
                </span>
              </div>
              <div className="grid-2" style={{ marginTop: 16 }}>
                <Action
                  className="primary"
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
        </>
      )}
      <h2 className="section-title">Your {circle}</h2>
      {peers.length ? (
        peers.map((peer) => <BrotherCard key={peer.id} peer={peer} />)
      ) : (
        <p className="notice">
          No accepted links yet. Share your code with someone you know.
        </p>
      )}
      <ListGroup>
        <ListLink
          to="/brethren/messages"
          icon="message"
          label="Messages"
          end={
            unread > 0 && (
              <span className="count" aria-label={`${unread} unread`}>
                {unread}
              </span>
            )
          }
        />
        <ListLink to="/brethren/add" icon="plus" label="Add by code" />
        <ListLink
          to="/brethren/sharing"
          icon="eye"
          label="My profile and sharing"
          detail={`What your ${circle} see, and your phone number`}
        />
      </ListGroup>
      <Action className="quiet" run={load}>
        <Icon name="refresh" size={16} />
        Refresh circle
      </Action>
    </Page>
  );
}
