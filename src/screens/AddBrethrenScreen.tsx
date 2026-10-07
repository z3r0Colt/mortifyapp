import { useState } from "react";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import type { Profile } from "../brethren/types";
import { cloud, result } from "../brethren/client";
import { useBrethren } from "../state/brethren";
import { Initial } from "../components/BrotherCard";
export default function AddBrethrenScreen() {
  const [code, setCode] = useState("");
  const [found, setFound] = useState<Pick<
    Profile,
    "id" | "display_name" | "sex" | "church_name"
  > | null>(null);
  const [sent, setSent] = useState(false);
  const { profile, peers, load } = useBrethren();
  return (
    <Page
      title="Add by private code"
      back={{ to: "/brethren", label: "Brethren" }}
      lede="Ask someone you know for a code. A link begins only after the other person accepts."
    >
      <label>
        Six character code
        <input
          className="code-input"
          maxLength={6}
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
          if (code.length !== 6)
            throw new Error("Enter the full six character code.");
          if (peers.length >= 8)
            throw new Error("Your circle already has eight brethren.");
          const rows = (await result(
            cloud().rpc("lookup_brethren", { p_code: code }),
          )) as (typeof found)[];
          if (!rows[0])
            throw new Error(
              "Code unavailable. Check it with your brother or sister, or try later.",
            );
          if (rows[0].sex !== profile?.sex)
            throw new Error("Men link with brothers; women link with sisters.");
          setFound(rows[0]);
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
                await result(cloud().rpc("request_link", { p_code: code }));
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
