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
        <div className="bar-row" key={label}>
          <div className="bar-label">
            <span>{label}</span>
            <small>
              {count} {count === 1 ? "examination" : "examinations"}
            </small>
          </div>
          <div className="bar-track">
            <div
              className="bar"
              style={{ width: `${(count / (patterns?.total || 1)) * 100}%` }}
            />
          </div>
        </div>
      ))
    ) : (
      <p className="label">No patterns recorded this week.</p>
    );
  return (
    <Page
      title="The past week's patterns"
      back={{ to: "/examine", label: "Examine" }}
      lede="Consider these occasions with prayer and the counsel of a trusted believer."
    >
      {error && <p role="alert">{error}</p>}
      {patterns ? (
        <>
          <article className="card">
            <h2 className="section-title">Heart roots</h2>
            {bars(patterns.roots)}
          </article>
          <article className="card">
            <h2 className="section-title">Occasions of sin</h2>
            {bars(patterns.occasions)}
          </article>
        </>
      ) : (
        <p className="label" role="status">
          Reading examinations…
        </p>
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
