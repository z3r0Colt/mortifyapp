import { useState } from "react";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { ListGroup, ListLink, SwitchRow } from "../components/List";
import { useBrethren } from "../state/brethren";
import { cloud, result } from "../brethren/client";
import type { Sharing } from "../brethren/types";
const choices: [keyof Omit<Sharing, "user_id">, string, string][] = [
  ["share_battles", "Battles", "The names of the battles you have chosen."],
  [
    "share_temptations",
    "Temptations",
    "When you ask for help in temptation and when you stood firm.",
  ],
  [
    "share_falls",
    "Falls",
    "A plain note that you fell and confessed, with no private detail.",
  ],
  [
    "share_blocker_status",
    "Protection status",
    "Whether your phone’s protection is on or off.",
  ],
];
export default function SharingScreen() {
  const { sharing, load, profile } = useBrethren();
  const [name, setName] = useState(profile?.display_name ?? "");
  const [church, setChurch] = useState(profile?.church_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [saved, setSaved] = useState(false);
  const circle = profile?.sex === "sister" ? "sisters" : "brethren";
  return (
    <Page
      title="My profile and sharing"
      back={{
        to: "/brethren",
        label: profile?.sex === "sister" ? "Sisters" : "Brethren",
      }}
      lede={`Only your accepted ${circle} see any of this. Your journal and confession text are never shared.`}
    >
      <h2 className="section-title">My profile</h2>
      <article className="card">
        <label style={{ marginTop: 0 }}>
          Display name
          <input
            maxLength={60}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
          />
        </label>
        <label>
          Church name (optional)
          <input
            maxLength={120}
            value={church}
            onChange={(e) => {
              setChurch(e.target.value);
              setSaved(false);
            }}
          />
        </label>
        <label>
          Phone number (optional)
          <input
            type="tel"
            maxLength={25}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setSaved(false);
            }}
          />
        </label>
        <p className="hint">
          Your {circle} can call this number from the Flee steps.
        </p>
        <div className="stack">
          <Action
            className="primary"
            run={async () => {
              if (!name.trim()) throw new Error("Enter a display name.");
              await result(
                cloud()
                  .from("profiles")
                  .update({
                    display_name: name.trim(),
                    church_name: church.trim() || null,
                    phone: phone.trim() || null,
                  })
                  .eq("id", profile!.id),
              );
              await load();
              setSaved(true);
            }}
          >
            Save profile
          </Action>
        </div>
        {saved && (
          <p role="status" style={{ marginTop: 12 }}>
            Your profile is saved.
          </p>
        )}
      </article>
      {sharing && (
        <ListGroup title={`What my ${circle} see`}>
          {choices.map(([key, title, description]) => (
            <SwitchRow
              key={key}
              label={title}
              detail={description}
              checked={sharing[key]}
              onChange={async (on) => {
                await result(
                  cloud()
                    .from("shared_settings")
                    .update({ [key]: on })
                    .eq("user_id", sharing.user_id),
                );
                await load();
              }}
            />
          ))}
        </ListGroup>
      )}
      <ListGroup>
        <ListLink
          to="/brethren/preview"
          icon="eye"
          label="Preview what they see"
        />
      </ListGroup>
    </Page>
  );
}
