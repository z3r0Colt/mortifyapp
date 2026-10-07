import type { Prayer } from "../content/loader";
// A prayer to pray, with its author and source when it is a historic one.
export function PrayerCard({
  prayer,
  prominent = false,
}: {
  prayer: Prayer;
  prominent?: boolean;
}) {
  return (
    <div className="card accent">
      <h2>{prayer.title}</h2>
      <p className={prominent ? "verse" : undefined}>{prayer.text}</p>
      {prayer.author && (
        <small className="attribution">
          <strong>{prayer.author}</strong> · {prayer.source}
        </small>
      )}
    </div>
  );
}
