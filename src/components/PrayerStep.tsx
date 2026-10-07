import { useState } from "react";
import { Action } from "./Action";
import { Icon } from "./Icon";
import { useAuth } from "../state/auth";
import { useBrethren } from "../state/brethren";
import { requestPrayer } from "../brethren/outbox";
import { useCircleWords } from "../brethren/words";
// onChosen fires once the user has asked for prayer or called someone, so
// the Flee screen can let him go on only after he has sought help. With no
// circle yet (noCircle) nothing here holds him back.
export function PrayerStep({
  battle,
  noCircle,
  onChosen,
}: {
  battle: string;
  noCircle: boolean;
  onChosen: () => void;
}) {
  const { peers } = useBrethren();
  const user = useAuth((s) => s.user);
  const { circle, Circle, one } = useCircleWords();
  const [status, setStatus] = useState("");
  const [asked, setAsked] = useState(false);
  const [calls, setCalls] = useState(false);
  const calledMyself = (
    <button onClick={onChosen}>I have called someone</button>
  );
  if (!user || noCircle)
    return (
      <>
        <p>Seek the care of a trusted believer in your church.</p>
        <p className="notice">
          You have no {circle} linked in Mortify yet. Call a trusted {one} from
          your own contacts and ask for prayer. When this hour has passed, you
          can link with a few from your church under {Circle}.
        </p>
      </>
    );
  return (
    <>
      <p>Seek the care of a trusted believer in your church.</p>
      {asked ? (
        <p role="status" className="notice">
          {status}
        </p>
      ) : (
        <Action
          className="primary"
          run={async () => {
            await requestPrayer(battle);
            setStatus(
              navigator.onLine
                ? `Your ${circle} have been asked to pray for you.`
                : `Your request will go to your ${circle} when Mortify reconnects.`,
            );
            setAsked(true);
            onChosen();
          }}
        >
          Ask my {circle} to pray
        </Action>
      )}
      <button aria-expanded={calls} onClick={() => setCalls(!calls)}>
        <Icon name="phone" size={18} />
        Call a {one}
      </button>
      {calls && (
        <div className="stack fade">
          {peers
            .filter((p) => p.phone)
            .map((p) => (
              <a
                className="button"
                key={p.id}
                href={`tel:${p.phone!.replace(/[^+0-9]/g, "")}`}
                onClick={onChosen}
              >
                {p.display_name}
              </a>
            ))}
          {!peers.some((p) => p.phone) && (
            <>
              <p className="notice">
                No phone numbers are shared here. You may call a trusted
                believer from your own contacts.
              </p>
              {calledMyself}
            </>
          )}
        </div>
      )}
    </>
  );
}
