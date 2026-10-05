import { useEffect, useState } from "react";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { Icon } from "../components/Icon";
import { useAuth } from "../state/auth";
import { journalKey } from "../state/privacy";
import { useApp } from "../state/app";
import { allEntries, deleteEntry } from "../data/remote";
import { waiting } from "../data/pending";
import { db } from "../data/db";
import { decryptText } from "../privacy/crypto";
type Entry = {
  id: string;
  kind: "journals" | "falls";
  date: Date;
  battle: string;
  waiting: boolean;
  text?: string;
  tags?: string[];
  confession?: string;
  reflection?: string;
};
const blank = (entry: Entry) =>
  !entry.text && !entry.confession && !entry.reflection && !entry.tags?.length;
// Past examinations and confessions, opened on this phone with the PIN key.
export default function JournalScreen() {
  const user = useAuth((s) => s.user);
  const packs = useApp((s) => s.packs);
  const [entries, setEntries] = useState<Entry[]>();
  const [error, setError] = useState("");
  const load = async () => {
    if (!user) return;
    const key = journalKey();
    const [queuedJournals, queuedFalls] = await Promise.all([
      waiting("journals"),
      waiting("falls"),
    ]);
    let saved: Awaited<ReturnType<typeof allEntries>> = {
      journals: [],
      falls: [],
      fleeLogs: [],
    };
    try {
      saved = await allEntries(user.id);
      setError("");
    } catch {
      setError(
        navigator.onLine
          ? "Could not open your journal. Please try again."
          : "You are offline. Only entries written on this phone while offline are shown.",
      );
    }
    const queued = new Set(
      [...queuedJournals, ...queuedFalls].map((row) => row.id),
    );
    const journals = await Promise.all(
      [...saved.journals, ...queuedJournals].map(
        async (row): Promise<Entry> => ({
          id: row.id,
          kind: "journals",
          date: new Date(row.created_at),
          battle: row.battle,
          waiting: queued.has(row.id),
          text: await decryptText(key, row.body),
          tags: [...row.roots, ...row.occasions],
        }),
      ),
    );
    const falls = await Promise.all(
      [...saved.falls, ...queuedFalls].map(async (row): Promise<Entry> => ({
        id: row.id,
        kind: "falls",
        date: new Date(row.created_at),
        battle: row.battle,
        waiting: queued.has(row.id),
        confession: await decryptText(key, row.confession),
        reflection: await decryptText(key, row.reflection),
      })),
    );
    const unique = new Map<string, Entry>();
    for (const entry of [...journals, ...falls]) unique.set(entry.id, entry);
    setEntries(
      [...unique.values()].sort((a, b) => b.date.getTime() - a.date.getTime()),
    );
  };
  useEffect(() => {
    void load().catch(() => setError("Could not open your journal."));
  }, [user?.id]);
  const name = (battle: string) =>
    packs.find((p) => p.id === battle)?.name ?? battle;
  return (
    <Page
      title="My journal"
      back={{ to: "/examine", label: "Examine" }}
      lede="Your examinations and confessions. Only you can read them; they are unlocked on this phone with your PIN."
    >
      {error && <p className="notice">{error}</p>}
      {!entries ? (
        !error && (
          <p className="label" role="status">
            Opening your journal…
          </p>
        )
      ) : entries.length === 0 ? (
        <p className="label">
          Nothing written yet. Your evening examinations and any confessions
          after a fall will be kept here.
        </p>
      ) : (
        entries.map((entry) => (
          <article className="card journal-entry fade" key={entry.id}>
            <p className="eyebrow">
              {entry.date.toLocaleString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
            <h2>
              {entry.kind === "journals" ? "Examination" : "After a fall"}
              <span className="tag">{name(entry.battle)}</span>
            </h2>
            {entry.waiting && (
              <p className="label">Waiting to upload when you reconnect.</p>
            )}
            {entry.text && <p className="journal-text">{entry.text}</p>}
            {entry.tags && entry.tags.length > 0 && (
              <div className="row" style={{ gap: 6, marginBottom: 12 }}>
                {entry.tags.map((tag) => (
                  <span className="tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {entry.confession && (
              <>
                <h3 className="section-title">Confession</h3>
                <p className="journal-text">{entry.confession}</p>
              </>
            )}
            {entry.reflection && (
              <>
                <h3 className="section-title">Reflection</h3>
                <p className="journal-text">{entry.reflection}</p>
              </>
            )}
            {blank(entry) && <p className="label">No words were written.</p>}
            <Action
              className="quiet"
              run={async () => {
                if (
                  !window.confirm(
                    "Permanently delete this entry? This cannot be undone.",
                  )
                )
                  return;
                if (entry.waiting) await db.pending.delete(entry.id);
                else await deleteEntry(entry.kind, entry.id);
                await load();
              }}
            >
              <Icon name="close" size={16} />
              Delete
            </Action>
          </article>
        ))
      )}
    </Page>
  );
}
