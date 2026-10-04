import { useState } from "react";
import { Link } from "react-router-dom";
import { Action } from "./Action";
import { useAuth } from "../state/auth";
import { useBrethren } from "../state/brethren";
import { requestPrayer } from "../brethren/outbox";
export function PrayerStep({ battle }: { battle: string }) {
  const { profile, peers } = useBrethren();
  const user = useAuth((s) => s.user);
  const [status, setStatus] = useState("");
  const [calls, setCalls] = useState(false);
  const sister = profile?.sex === "sister";
  return (
    <>
      <p>Seek the care of a trusted believer in your church.</p>
      {user ? (
        <Action
          className="primary"
          run={async () => {
            setStatus(await requestPrayer(battle));
          }}
        >
          Ask my {sister ? "sisters" : "brethren"} to pray
        </Action>
      ) : (
        <Link to="/sign-in">Sign in to ask your brethren to pray</Link>
      )}
      {status && <p role="status">{status}</p>}
      <button onClick={() => setCalls(!calls)}>
        Call a {sister ? "sister" : "brother"}
      </button>
      {calls && (
        <div className="stack">
          {peers
            .filter((p) => p.phone)
            .map((p) => (
              <a
                className="button"
                key={p.id}
                href={`tel:${p.phone!.replace(/[^+0-9]/g, "")}`}
              >
                {p.display_name}
              </a>
            ))}
          {!peers.some((p) => p.phone) && (
            <p>
              No phone numbers are shared here. You may call a trusted believer
              from your own contacts.
            </p>
          )}
        </div>
      )}
    </>
  );
}
