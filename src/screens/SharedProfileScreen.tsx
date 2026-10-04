import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { MessageComposer } from "../components/MessageComposer";
import { sharedProfile, eventLabel } from "../brethren/profiles";
import { sendMessage } from "../brethren/messages";
import { useAuth } from "../state/auth";
import { useApp } from "../state/app";
export default function SharedProfileScreen({
  preview = false,
}: {
  preview?: boolean;
}) {
  const params = useParams();
  const user = useAuth((s) => s.user);
  const id = preview ? user?.id : params.id;
  const [data, setData] = useState<Awaited<ReturnType<typeof sharedProfile>>>();
  const [error, setError] = useState("");
  const [compose, setCompose] = useState(false);
  const [sent, setSent] = useState("");
  const packs = useApp((s) => s.packs);
  useEffect(() => {
    let active = true;
    if (id)
      void sharedProfile(id)
        .then((d) => {
          if (active) setData(d);
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    return () => {
      active = false;
    };
  }, [id]);
  const name = (battle: string) =>
    packs.find((p) => p.id === battle)?.name ?? battle;
  return (
    <Page
      back={{ to: "/brethren", label: "Brethren" }}
      title={
        preview
          ? `What my ${data?.profile.sex === "sister" ? "sisters" : "brethren"} see`
          : (data?.profile.display_name ?? "Shared profile")
      }
    >
      {error && <p role="alert">{error}</p>}
      {data ? (
        <>
          {data.profile.church_name && (
            <p className="lede" style={{ marginTop: "-1rem" }}>
              {data.profile.church_name}
            </p>
          )}
          {data.battles.length > 0 && (
            <>
              <h2 className="section-title">Battles</h2>
              <div className="row">
                {data.battles.map((b) => (
                  <span className="tag" key={b}>
                    {name(b)}
                  </span>
                ))}
              </div>
            </>
          )}
          {data.blockerOff && (
            <p className="notice" style={{ marginTop: 16 }}>
              Protection is currently recorded as off.
            </p>
          )}
          <h2 className="section-title">The past 30 days</h2>
          {data.events.length ? (
            <ul className="timeline card">
              {data.events.map((event) => (
                <li key={event.id}>
                  {eventLabel(event.event_type)},{" "}
                  {new Date(event.created_at).toLocaleString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                  {event.battle_id && `, ${name(event.battle_id)}`}
                </li>
              ))}
            </ul>
          ) : (
            <p className="label">No events are shared here.</p>
          )}
          {!preview && id !== user?.id && (
            <>
              <div className="stack" style={{ marginTop: 22 }}>
                <Action
                  className="primary"
                  run={async () => {
                    await sendMessage(data.profile.id, "praying");
                    setSent("Your prayer message was sent.");
                  }}
                >
                  Pray for {data.profile.sex === "sister" ? "her" : "him"}
                </Action>
                <Action
                  run={async () => {
                    await sendMessage(data.profile.id, "checking_in");
                    setSent("Your check-in was sent.");
                  }}
                >
                  Check in
                </Action>
                <button
                  aria-expanded={compose}
                  onClick={() => setCompose(!compose)}
                >
                  Send encouragement
                </button>
              </div>
              {sent && <p role="status">{sent}</p>}
              {compose && <MessageComposer receiver={data.profile.id} />}
            </>
          )}
        </>
      ) : (
        !error && <p>Reading shared profile…</p>
      )}
    </Page>
  );
}
