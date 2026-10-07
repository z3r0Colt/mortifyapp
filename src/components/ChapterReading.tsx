import { Link, useLocation } from "react-router-dom";
import { useContent } from "../content/useContent";
import { loadBible } from "../bible/loader";
import { resolveChapterReference } from "../bible/resolver";
import { Icon } from "./Icon";
// A whole chapter from the BSB, or its opening verses with the way into the
// rest (the morning chapters and the evening psalm).
export function ChapterReading({
  reference,
  preview,
}: {
  reference: string;
  /** Show only this many opening verses. */
  preview?: number;
}) {
  const { data: bible, error } = useContent(loadBible);
  const location = useLocation();
  if (error) return <p role="alert">{error}</p>;
  if (!bible)
    return (
      <p className="label" role="status">
        Opening Scripture…
      </p>
    );
  try {
    const chapter = resolveChapterReference(bible, reference);
    const rows = chapter.verses.filter((row) => row.text.trim());
    const shown = preview ? rows.slice(0, preview) : rows;
    return (
      <div className="scripture fade">
        <div className="chapter-reader" aria-label={`${reference} BSB`}>
          {shown.map((row) => (
            <p key={row.verse}>
              <small
                className="verse-number reference"
                aria-label={`Verse ${row.verse}`}
              >
                {row.verse}
              </small>{" "}
              {row.text}
            </p>
          ))}
        </div>
        <p className="reference">
          {reference} <small className="label">BSB</small>
        </p>
        <Link
          className="chapter-link label"
          to={`/bible/${encodeURIComponent(chapter.book)}/${chapter.chapter}`}
          state={{ backgroundLocation: location }}
        >
          <Icon name="book" size={16} />
          {shown.length < rows.length
            ? `Read all of ${reference}`
            : "Read the chapter"}
        </Link>
      </div>
    );
  } catch (error) {
    return (
      <p role="alert">
        {error instanceof Error
          ? error.message
          : "Could not read this chapter."}
      </p>
    );
  }
}
