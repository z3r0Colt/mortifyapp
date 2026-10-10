import { useState } from "react";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { Icon } from "../components/Icon";
import { usePreferences } from "../state/preferences";
import { heartRoots, occasionTags } from "../data/patterns";
const MAX_TAGS = 30;
const MAX_LENGTH = 40;
/** Trims, and refuses blanks, duplicates, hidden characters and long lists. */
function clean(list: string[], kind: string) {
  const tags = list.map((t) => t.trim().replace(/\s+/g, " "));
  if (tags.some((t) => !t))
    throw new Error(`Fill in or remove the empty ${kind}.`);
  if (tags.some((t) => t.length > MAX_LENGTH))
    throw new Error(`Keep each ${kind} to ${MAX_LENGTH} letters.`);
  if (tags.some((t) => /[\u0000-\u001f\u007f]/.test(t)))
    throw new Error(`Use only plain words in each ${kind}.`);
  if (new Set(tags.map((t) => t.toLowerCase())).size !== tags.length)
    throw new Error(`Each ${kind} can appear only once.`);
  if (tags.length > MAX_TAGS) throw new Error(`Keep to ${MAX_TAGS} or fewer.`);
  return tags;
}
const same = (a: string[], b: string[]) =>
  a.length === b.length && a.every((t, i) => t === b[i]);
function TagList({
  title,
  detail,
  kind,
  value,
  usual,
  onChange,
}: {
  title: string;
  detail: string;
  kind: string;
  value: string[];
  usual: string[];
  onChange: (value: string[]) => void;
}) {
  const [adding, setAdding] = useState("");
  const add = () => {
    const tag = adding.trim().replace(/\s+/g, " ");
    if (!tag || value.length >= MAX_TAGS) return;
    onChange([...value, tag]);
    setAdding("");
  };
  return (
    <section className="tag-editor">
      <h2 className="section-title">{title}</h2>
      <p className="label">{detail}</p>
      <ul className="list">
        {value.map((tag, i) => (
          <li key={i} className="tag-row">
            <input
              aria-label={`${kind} ${i + 1}`}
              maxLength={MAX_LENGTH}
              value={tag}
              onChange={(e) =>
                onChange(value.map((t, j) => (j === i ? e.target.value : t)))
              }
            />
            <button
              className="icon-button small"
              aria-label={`Remove ${tag || kind}`}
              onClick={() => onChange(value.filter((_, j) => j !== i))}
            >
              <Icon name="close" size={16} />
            </button>
          </li>
        ))}
      </ul>
      <div className="tag-add">
        <input
          aria-label={`New ${kind}`}
          placeholder={`Add a ${kind}`}
          maxLength={MAX_LENGTH}
          value={adding}
          onChange={(e) => setAdding(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button
          onClick={add}
          disabled={!adding.trim() || value.length >= MAX_TAGS}
        >
          <Icon name="plus" size={18} />
          Add
        </button>
      </div>
      {!same(value, usual) && (
        <button className="quiet" onClick={() => onChange(usual)}>
          <Icon name="refresh" size={16} />
          Restore the usual list
        </button>
      )}
    </section>
  );
}
// The heart roots and occasions of sin offered in the evening examination,
// kept in the account so they follow the user to a new phone. Past
// examinations keep the words they were saved with.
export default function TagsScreen() {
  const { value, save } = usePreferences();
  const [roots, setRoots] = useState(value.heartRoots ?? heartRoots);
  const [occasions, setOccasions] = useState(value.occasions ?? occasionTags);
  const [saved, setSaved] = useState(false);
  return (
    <Page
      title="Heart roots and occasions"
      back={{ to: "/settings", label: "Settings" }}
      lede="Choose the words you mark in each evening's examination. Past examinations keep the words they were saved with."
    >
      <TagList
        title="Heart roots"
        detail="What lay beneath the sin: the desire or fear that moved you."
        kind="heart root"
        value={roots}
        usual={heartRoots}
        onChange={(next) => {
          setRoots(next);
          setSaved(false);
        }}
      />
      <TagList
        title="Occasions of sin"
        detail="The times, places and circumstances where temptation came."
        kind="occasion"
        value={occasions}
        usual={occasionTags}
        onChange={(next) => {
          setOccasions(next);
          setSaved(false);
        }}
      />
      <div className="stack" style={{ marginTop: 24 }}>
        <Action
          className="primary"
          run={async () => {
            const r = clean(roots, "heart root");
            const o = clean(occasions, "occasion");
            // A list matching the usual one is saved as "usual", so later
            // improvements to the usual lists reach this account too.
            await save({
              heartRoots: same(r, heartRoots) ? null : r,
              occasions: same(o, occasionTags) ? null : o,
            });
            setRoots(r);
            setOccasions(o);
            setSaved(true);
          }}
        >
          Save changes
        </Action>
        {saved && (
          <p role="status" className="label">
            Saved. Your next examination will use these.
          </p>
        )}
      </div>
    </Page>
  );
}
