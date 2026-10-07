import { useState } from "react";
import { Action } from "./Action";
import { Icon } from "./Icon";
import { useBrethren } from "../state/brethren";
import { useAuth } from "../state/auth";
import { queueEvent, circleNote } from "../brethren/outbox";
import { Scripture } from "./Scripture";
import { useCircleWords } from "../brethren/words";
export function TellBrethrenStep({ battle }: { battle: string }) {
  const { circle, one } = useCircleWords();
  const { sharing } = useBrethren();
  const noCircle = useBrethren(
    (s) => s.loaded && !s.error && (!s.profile || !s.peers.length),
  );
  const user = useAuth((s) => s.user);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <>
      <p>Confession to a trusted {one} is good for the soul.</p>
      <div className="card">
        <Scripture reference="James 5:16" />
      </div>
      <p className="hint">
        <Icon name="lock" size={16} />
        Your private confession is never included.
      </p>
      {user && !noCircle ? (
        <>
          {!sharing?.share_falls && (
            <p className="notice">
              Fall sharing is off. No fall event will be shared. You may still
              send a separate short message.
            </p>
          )}
          <label>
            Message to your circle (optional)
            <textarea
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          {sent ? (
            <p role="status">Your chosen sharing is saved for delivery.</p>
          ) : (
            <div className="stack">
              <Action
                run={async () => {
                  if (!sharing?.share_falls && !note.trim())
                    throw new Error(
                      "Fall sharing is off. Write a short message if you want to tell your circle.",
                    );
                  if (sharing?.share_falls) await queueEvent("fall", battle);
                  if (note.trim()) await circleNote(note);
                  setSent(true);
                }}
              >
                Tell my {circle}
              </Action>
            </div>
          )}
        </>
      ) : (
        <p className="notice">
          You have no {circle} linked in Mortify yet. You may speak to a trusted{" "}
          {one} in person or by phone.
        </p>
      )}
    </>
  );
}
