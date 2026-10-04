import { useContent } from "../content/useContent";
import { loadBible } from "../bible/loader";
import { resolveReference } from "../bible/resolver";
import { Link, useLocation } from "react-router-dom";
export function Scripture({ reference }: { reference: string }) {
  const { data: bible, error } = useContent(loadBible);
  const location = useLocation();
  if (error) return <p role="alert">{error}</p>;
  if (!bible) return <p role="status">Opening Scripture…</p>;
  try {
    const passage = resolveReference(bible, reference);
    return (
      <div className="scripture">
        <p className="verse">{passage.text}</p>
        <p className="reference">
          {reference} <small className="label">BSB</small>
        </p>
        {passage.omitted.length > 0 && (
          <p className="label">
            Some verse numbers in this range are omitted in the BSB main text.
          </p>
        )}
        <Link
          className="chapter-link label"
          to={`/bible/${encodeURIComponent(passage.book)}/${passage.start.chapter}#verse-${passage.start.verse}`}
          state={{ backgroundLocation: location }}
        >
          Read the chapter
        </Link>
      </div>
    );
  } catch (error) {
    return (
      <p role="alert">
        {error instanceof Error
          ? error.message
          : "Could not read this Scripture reference."}
      </p>
    );
  }
}
