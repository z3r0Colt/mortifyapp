import { useEffect, useState } from "react";
import { Page } from "../components/Page";
import { useBattlePacks } from "../content/selection";
import { db } from "../data/db";
import { weeklyPatterns } from "../data/patterns";
import { Scripture } from "../components/Scripture";
import { ContentReading } from "../components/ContentReading";
export default function PatternsScreen() {
  const [patterns, setPatterns] = useState<ReturnType<typeof weeklyPatterns>>();
  const [error, setError] = useState("");
  const pack = useBattlePacks()[0];
  useEffect(() => {
    void db.journals
      .where("time")
      .aboveOrEqual(Date.now() - 7 * 86400000)
      .toArray()
      .then((rows) => setPatterns(weeklyPatterns(rows)))
      .catch(() => setError("Unable to read local examinations."));
  }, []);
  const bars = (items: [string, number][]) =>
    items.length ? (
      items.map(([label, count]) => (
        <div key={label}>
          <p>
            {label}{" "}
            <small>
              ({count} {count === 1 ? "examination" : "examinations"})
            </small>
          </p>
          <div
            className="bar"
            style={{ width: `${(count / (patterns?.total || 1)) * 100}%` }}
          />
        </div>
      ))
    ) : (
      <p>No patterns recorded this week.</p>
    );
  return (
    <Page title="The past week's patterns">
      <p>
        Consider these occasions with prayer and the counsel of a trusted
        believer.
      </p>
      {error && <p role="alert">{error}</p>}
      {patterns ? (
        <>
          <h2>Heart roots</h2>
          {bars(patterns.roots)}
          <h2>Occasions of sin</h2>
          {bars(patterns.occasions)}
        </>
      ) : (
        <p>Reading examinations…</p>
      )}
      {pack && (
        <>
          <article className="card">
            <Scripture reference={pack.verses[0]} />
          </article>
          <article className="card">
            <ContentReading reading={pack.counsel[0]} />
          </article>
        </>
      )}
    </Page>
  );
}
