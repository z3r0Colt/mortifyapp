import { useApp } from "../state/app";
import { Page } from "../components/Page";
export default function DebugScreen() {
  const { packs, error, ready } = useApp();
  return (
    <Page
      title="Content packs"
      back={{ to: "/settings", label: "Settings" }}
      lede="These are the content packs loaded on this device."
    >
      {error && <p role="alert">{error}</p>}
      {!ready && !error && <p>Loading…</p>}
      {packs.map((p) => (
        <article className="card" key={p.id}>
          <h2>{p.name}</h2>
          <p className="label">
            {p.id} · {p.verses.length} passage(s) ·{" "}
            {p.examinationQuestions.length} examination questions
          </p>
          <p>
            {p.screenBased
              ? "Includes protection setup"
              : "No screen protection guide"}
          </p>
        </article>
      ))}
    </Page>
  );
}
