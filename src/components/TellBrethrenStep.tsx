import { useState } from "react";
import { Action } from "./Action";
import { useBrethren } from "../state/brethren";
import { useAuth } from "../state/auth";
import { queueEvent, circleNote } from "../brethren/outbox";
import { Scripture } from "./Scripture";
export function TellBrethrenStep({ battle }: { battle: string }) {
  const { sharing, profile } = useBrethren();
  const user = useAuth((s) => s.user);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <>
      <p>
        Confession to a trusted{" "}
        {profile?.sex === "sister" ? "sister" : "brother"} is good for the
        soul.{" "}
      </p>
      <Scripture reference="James 5:16" />
      <p>Your private confession is never included.</p>
      {user ? (
        <>
          {!sharing?.share_falls && (
            <p>
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
              Tell my {profile?.sex === "sister" ? "sisters" : "brethren"}
            </Action>
          )}
        </>
      ) : (
        <p>You may speak to a trusted believer in person or by phone.</p>
      )}
    </>
  );
}
