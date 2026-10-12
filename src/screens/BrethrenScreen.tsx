import { useEffect, useState } from "react";
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
import {
  clearInvite,
  codeUrl,
  inviteUrl,
  pendingInvite,
} from "../brethren/links";
// Shares by the phone's own share sheet, or copies where there is none.
// Closing the share sheet is not a failure.
async function send(title: string, text: string) {
  if (!navigator.share) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  try {
    await navigator.share({ title, text });
  } catch (e) {
    if (!(e instanceof DOMException && e.name === "AbortError")) throw e;
  }
  return false;
}
export default function BrethrenScreen() {
  const { profile, peers, requests, sent, load } = useBrethren();
  const unread = useMessages(
    (s) =>
      s.rows.filter((m) => !m.read && m.receiver_id === profile?.id).length,
  );
  const [copied, setCopied] = useState("");
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
        <div className="grid-2 share-row">
          <Action
            run={async () => {
              const text = `My Mortify ${circle} code is ${profile.brethren_code}. To add me, open ${codeUrl(profile.brethren_code)}`;
              if (await send("Mortify code", text))
                setCopied("Code copied. You may send it by text.");
            }}
          >
            <Icon name="share" size={18} />
            Share code
          </Action>
          {/* A one-time link for someone who may not have Mortify yet. It
              links the two at once when they confirm, so it is for one
              person, and works once within seven days. */}
          <Action
            run={async () => {
              const token = (await result(
                cloud().rpc("create_invite"),
              )) as string;
              const text = `I would like you among my ${circle} in Mortify, to pray for and watch over one another. This invite is for you alone and works once, within 7 days: ${inviteUrl(token)}`;
              if (await send("Mortify invite", text))
                setCopied("Invite copied. You may send it by text.");
            }}
          >
            <Icon name="mail" size={18} />
            Invite
          </Action>
        </div>
        {copied && <p role="status">{copied}</p>}
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
            setCopied("");
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
      <InviteCard circle={circle} onLinked={load} />
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
          No accepted links yet. Share your code or send an invite to someone
          you know.
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
// The one who invited this person, waiting in the list for them to confirm.
// Confirming links the two at once, because making the invite was the
// inviter's yes.
function InviteCard({
  circle,
  onLinked,
}: {
  circle: string;
  onLinked: () => Promise<void>;
}) {
  const [token] = useState(pendingInvite);
  const [inviter, setInviter] = useState<{
    display_name: string;
    church_name: string | null;
  } | null>(null);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (!token) return;
    let active = true;
    result(cloud().rpc("invite_details", { p_token: token })).then(
      (found) => {
        if (!active) return;
        if (found) setInviter(found as NonNullable<typeof inviter>);
        else {
          clearInvite();
          setGone(true);
        }
      },
      // Offline or a passing failure: the invite waits for next time.
      () => {},
    );
    return () => {
      active = false;
    };
  }, [token]);
  if (gone)
    return (
      <p className="notice fade">
        That invite can no longer be used. It may have been used already, or be
        more than 7 days old. Ask for a new one, or for a code.
      </p>
    );
  if (!token || !inviter) return null;
  return (
    <article className="card fade">
      <div className="person">
        <Initial name={inviter.display_name} />
        <span className="row-text">
          <strong>{inviter.display_name}</strong>
          <span>
            Invited you to be {circle}
            {inviter.church_name ? ` · ${inviter.church_name}` : ""}
          </span>
        </span>
      </div>
      <div className="grid-2" style={{ marginTop: 16 }}>
        <Action
          className="primary"
          run={async () => {
            await result(cloud().rpc("accept_invite", { p_token: token }));
            clearInvite();
            setInviter(null);
            await onLinked();
          }}
        >
          Confirm
        </Action>
        <Action
          run={async () => {
            clearInvite();
            setInviter(null);
          }}
        >
          Decline
        </Action>
      </div>
    </article>
  );
}
