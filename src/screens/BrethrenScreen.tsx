import { useState } from "react";
import { Link } from "react-router-dom";
import { useNotifyState } from "../components/NotifyCard";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { Icon } from "../components/Icon";
import { ListGroup, ListLink } from "../components/List";
import { BrotherCard, Initial } from "../components/BrotherCard";
import { useBrethren } from "../state/brethren";
import { cloud, result } from "../brethren/client";
import { useMessages } from "../state/messages";
export default function BrethrenScreen() {
  const { profile, peers, requests, sent, load } = useBrethren();
  const unread = useMessages(
    (s) =>
      s.rows.filter((m) => !m.read && m.receiver_id === profile?.id).length,
  );
  const [copied, setCopied] = useState(false);
  const notify = useNotifyState();
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
        {/* A new code stops anyone who has the old one from asking to link.
            Those already linked stay linked. */}
        <Action
          className="quiet"
          run={async () => {
            if (
              !window.confirm(
                `Get a new code? Your old code will stop working. Your ${circle} stay as they are.`,
              )
            )
              return;
            await result(cloud().rpc("rotate_brethren_code"));
            setCopied(false);
            await load();
          }}
        >
          <Icon name="refresh" size={16} />
          Get a new code
        </Action>
      </article>
      {notify && notify !== "ready" && (
        <Link className="card person fade" to="/notifications">
          <span className="tile">
            <Icon name="bell" size={20} />
          </span>
          <span className="row-text">
            <strong>You will not hear prayer requests</strong>
            <span>
              Notifications are not on for this phone, so you will not know when
              your {circle} ask you to pray. Set them up.
            </span>
          </span>
          <Icon name="chevron" size={18} className="chevron" />
        </Link>
      )}
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
              <Action
                className="quiet"
                run={async () => {
                  if (
                    !window.confirm(
                      `Decline and block ${r.display_name}? They will not be able to ask you again.`,
                    )
                  )
                    return;
                  await result(
                    cloud().rpc("block_request", { p_link: r.link_id }),
                  );
                  await load();
                }}
              >
                Decline and block
              </Action>
            </article>
          ))}
        </>
      )}
      <h2 className="section-title">Your {circle}</h2>
      {peers.map((peer) => (
        <BrotherCard key={peer.id} peer={peer} />
      ))}
      {sent.map((r) => (
        <article className="card fade" key={r.link_id}>
          <div className="person">
            <Initial name={r.display_name} />
            <span className="row-text">
              <strong>{r.display_name}</strong>
              <span>Has not yet accepted your request</span>
            </span>
          </div>
          <Action
            className="quiet"
            run={async () => {
              await result(
                cloud().rpc("withdraw_request", { p_link: r.link_id }),
              );
              await load();
            }}
          >
            Withdraw request
          </Action>
        </article>
      ))}
      {!peers.length && !sent.length && (
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
