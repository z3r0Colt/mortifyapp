import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { useBrethren } from "../state/brethren";
import { cloud, result } from "../brethren/client";
import type { Sharing } from "../brethren/types";
const choices: [keyof Omit<Sharing, "user_id">, string, string][] = [
  [
    "share_battles",
    "Battles",
    "Your brethren see the names of the battles you choose to share.",
  ],
  [
    "share_temptations",
    "Temptations",
    "Your brethren see when you ask for help in temptation and when you stood firm.",
  ],
  [
    "share_falls",
    "Falls",
    "Your brethren see a plain note that you fell and confessed, with no private detail.",
  ],
  [
    "share_blocker_status",
    "Protection status",
    "Your brethren see whether your protection is on or off.",
  ],
];
export default function SharingScreen() {
  const { sharing, load } = useBrethren();
  return (
    <Page title="What I share">
      <p>Your journal and confession text are never shared.</p>
      {sharing &&
        choices.map(([key, title, description]) => (
          <article className="card" key={key}>
            <h2>{title}</h2>
            <p>{description}</p>
            <p className="label">Currently {sharing[key] ? "on" : "off"}</p>
            <Action
              checked={sharing[key]}
              run={async () => {
                await result(
                  cloud()
                    .from("shared_settings")
                    .update({ [key]: !sharing[key] })
                    .eq("user_id", sharing.user_id),
                );
                await load();
              }}
            >
              {sharing[key] ? "Turn off" : "Turn on"}
            </Action>
          </article>
        ))}
    </Page>
  );
}
