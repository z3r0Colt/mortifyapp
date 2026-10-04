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
  const { sharing, load, profile } = useBrethren();
  return (
    <Page
      title="What I share"
      back={{
        to: "/brethren",
        label: profile?.sex === "sister" ? "Sisters" : "Brethren",
      }}
      lede="Your journal and confession text are never shared."
    >
      {sharing && (
        <ul className="list">
          {choices.map(([key, title, description]) => (
            <li key={key}>
              <div className="list-row" style={{ alignItems: "flex-start" }}>
                <span className="row-text" id={`share-${key}`}>
                  {title}
                  <span className="row-detail">{description}</span>
                </span>
                <Action
                  className="switch"
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
                  {sharing[key] ? `Turn off ${title}` : `Turn on ${title}`}
                </Action>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
