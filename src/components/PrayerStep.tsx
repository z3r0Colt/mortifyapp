import { useState } from "react";
import { Action } from "./Action";
import { Icon } from "./Icon";
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
        <p className="notice">
          Call a trusted believer from your own contacts and ask for prayer.
        </p>
      )}
      {status && <p role="status">{status}</p>}
      {user && (
        <button aria-expanded={calls} onClick={() => setCalls(!calls)}>
          <Icon name="phone" size={18} />
          Call a {sister ? "sister" : "brother"}
        </button>
      )}
      {calls && (
        <div className="stack fade">
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
            <p className="notice">
              No phone numbers are shared here. You may call a trusted believer
              from your own contacts.
            </p>
          )}
        </div>
      )}
    </>
  );
}
