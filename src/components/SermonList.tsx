import type { Sermon } from "../content/loader";
import { Icon } from "./Icon";
// Sermons open on SermonAudio, outside the app.
export function SermonList({ sermons }: { sermons: Sermon[] }) {
  return (
    <ul className="list sermons">
      {sermons.map((sermon) => (
        <li key={sermon.url}>
          <a
            className="list-row"
            href={sermon.url}
            target="_blank"
            rel="noreferrer"
          >
            <span className="row-text">
              {sermon.title}
              <span className="row-detail">
                {sermon.preacher} ·{" "}
                {new Date(`${sermon.date}T12:00`).toLocaleDateString(
                  undefined,
                  { month: "short", day: "numeric", year: "numeric" },
                )}
                {sermon.passage && ` · ${sermon.passage}`}
              </span>
            </span>
            <Icon name="arrow" size={18} className="chevron" />
          </a>
        </li>
      ))}
    </ul>
  );
}
