import type { Prayer } from "../content/loader";
// A prayer set out like a page of a prayer book: its title, the words of
// adoration that open it, its body, and the praise that closes it.
export function PrayerCard({
  prayer,
  prominent = false,
}: {
  prayer: Prayer;
  prominent?: boolean;
}) {
  return (
    <article className={`card accent prayer${prominent ? " prominent" : ""}`}>
      <header className="prayer-head">
        <h2>{prayer.title}</h2>
        <span className="prayer-rule" aria-hidden="true">
          <i />
        </span>
      </header>
      {prayer.opening && <p className="prayer-praise">{prayer.opening}</p>}
      <p className="prayer-body">{prayer.text}</p>
      {prayer.closing && <p className="prayer-praise">{prayer.closing}</p>}
      {prayer.author && (
        <small className="attribution">
          <strong>{prayer.author}</strong> · {prayer.source}
        </small>
      )}
    </article>
  );
}
