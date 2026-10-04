import { useState } from "react";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import type { Profile } from "../brethren/types";
import { cloud, result } from "../brethren/client";
import { useBrethren } from "../state/brethren";
export default function AddBrethrenScreen() {
  const [code, setCode] = useState("");
  const [found, setFound] = useState<Pick<
    Profile,
    "id" | "display_name" | "sex" | "church_name"
  > | null>(null);
  const [sent, setSent] = useState(false);
  const { profile, peers } = useBrethren();
  return (
    <Page title="Add by private code">
      <p>
        Ask someone you know for a code. A link begins only after the other
        person accepts.
      </p>
      <label>
        Six character code
        <input
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
        <article className="card">
          <h2>{found.display_name}</h2>
          <p>{found.church_name}</p>
          {sent ? (
            <p role="status">
              Request sent. Your link will begin when it is accepted.
            </p>
          ) : (
            <Action
              run={async () => {
                await result(cloud().rpc("request_link", { p_code: code }));
                setSent(true);
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
