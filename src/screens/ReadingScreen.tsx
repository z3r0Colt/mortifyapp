import { useEffect, useState } from "react";
import { Page } from "../components/Page";
import { useBattlePacks } from "../content/selection";
import { dailyReading } from "../content/daily";
import { Scripture } from "../components/Scripture";
import { ContentReading } from "../components/ContentReading";
export default function ReadingScreen() {
  const packs = useBattlePacks();
  const key = packs.map((p) => p.id).join(",");
  const [data, setData] = useState<Awaited<ReturnType<typeof dailyReading>>>();
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void dailyReading(packs)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active)
          setError(e instanceof Error ? e.message : "Could not load reading.");
      });
    return () => {
      active = false;
    };
  }, [key]);
  return (
    <Page title="Today's Reading">
      {error && <p role="alert">{error}</p>}
      {data ? (
        <>
          <article>
            <h2>Scripture</h2>
            <Scripture reference={data.verse} />
          </article>
          <article className="card">
            <h2>{data.question.question}</h2>
            <p>{data.question.answer}</p>
            <small>{data.question.source}</small>
          </article>
          <article>
            <h2>Counsel</h2>
            <ContentReading reading={data.counsel} />
          </article>
          {data.lordsDay && (
            <article className="card">
              <h2>{data.lordsDay.title}</h2>
              <p>{data.lordsDay.text}</p>
            </article>
          )}
        </>
      ) : (
        !error && <p>Opening today's reading…</p>
      )}
    </Page>
  );
}
