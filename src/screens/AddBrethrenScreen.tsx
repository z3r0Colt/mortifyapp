import { useState } from "react";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { cloud, result } from "../brethren/client";
import { useBrethren } from "../state/brethren";
import { Initial } from "../components/BrotherCard";
import { useCircleWords } from "../brethren/words";
// Every failure reads the same, so a code cannot be probed for who it is.
const unavailable =
  "Code unavailable. Check it with the one who gave it to you, or try again later.";
export default function AddBrethrenScreen() {
  const [code, setCode] = useState("");
  const [found, setFound] = useState<{
    display_name: string;
    church_name: string | null;
  } | null>(null);
  const [sent, setSent] = useState(false);
  const { peers, load } = useBrethren();
  const { circle, Circle } = useCircleWords();
  return (
    <Page
      title="Add by private code"
      back={{ to: "/brethren", label: Circle }}
      lede="Ask someone you know for a code. A link begins only after the other person accepts."
    >
      <label>
        Private code
        <input
          className="code-input"
          maxLength={8}
          autoCapitalize="characters"
          autoComplete="off"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ""));
            setFound(null);
            setSent(false);
          }}
        />
      </label>
      <Action
        className="primary"
        run={async () => {
          if (code.length !== 6 && code.length !== 8)
            throw new Error("Enter the whole code.");
          if (peers.length >= 8)
            throw new Error(`Your circle already has eight ${circle}.`);
          // One answer, or none. (Before the 2026-10-08 database update the
          // answer came as a list; accept both while the two roll out.)
          const raw = (await result(
            cloud().rpc("lookup_brethren", { p_code: code }),
          )) as typeof found | (typeof found)[];
          const match = Array.isArray(raw) ? (raw[0] ?? null) : raw;
          if (!match) throw new Error(unavailable);
          setFound(match);
        }}
      >
        Find by code
      </Action>
      {found && (
        <article className="card fade" style={{ marginTop: 22 }}>
          <div className="person" style={{ marginBottom: 16 }}>
            <Initial name={found.display_name} />
            <span className="row-text">
              <strong>{found.display_name}</strong>
              {found.church_name && <span>{found.church_name}</span>}
            </span>
          </div>
          {sent ? (
            <p role="status">
              Request sent. It shows as waiting in your circle until{" "}
              {found.display_name} accepts.
            </p>
          ) : (
            <Action
              className="primary"
              run={async () => {
                const link = await result(
                  cloud().rpc("request_link", { p_code: code }),
                );
                if (!link) throw new Error(unavailable);
                setSent(true);
                await load();
              }}
            >
              Confirm and send request
            </Action>
          )}
        </article>
      )}
    </Page>
  );
}
