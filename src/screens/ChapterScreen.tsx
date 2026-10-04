import { useEffect } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Page } from "../components/Page";
import { useContent } from "../content/useContent";
import { loadBible } from "../bible/loader";
import { resolveChapter } from "../bible/resolver";
export default function ChapterScreen() {
  const { book = "", chapter = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: bible, error } = useContent(loadBible);
  useEffect(() => {
    if (bible && /^#verse-\d+$/.test(location.hash))
      document
        .getElementById(location.hash.slice(1))
        ?.scrollIntoView({ block: "center" });
  }, [bible, location.hash]);
  let result: ReturnType<typeof resolveChapter> | undefined;
  let problem = error;
  if (bible)
    try {
      if (!/^[1-9]\d*$/.test(chapter))
        throw new Error("Choose a valid chapter.");
      result = resolveChapter(bible, book, Number(chapter));
    } catch (error) {
      problem =
        error instanceof Error ? error.message : "Could not open this chapter.";
    }
  return (
    <Page
      calm
      title={result ? `${result.book} ${result.chapter}` : "Read the chapter"}
    >
      {location.state?.backgroundLocation ? (
        <button className="quiet" onClick={() => navigate(-1)}>
          Return to the reading
        </button>
      ) : (
        <Link className="quiet" to="/">
          Return home
        </Link>
      )}
      {problem ? (
        <p role="alert">{problem}</p>
      ) : result ? (
        <article
          className="chapter-reader"
          aria-label={`${result.book} ${result.chapter} BSB`}
        >
          <p className="reference">
            {result.book} {result.chapter} <small className="label">BSB</small>
          </p>
          {result.verses
            .filter((row) => row.text.trim())
            .map((row) => (
              <p id={`verse-${row.verse}`} key={row.verse}>
                <small
                  className="verse-number reference"
                  aria-label={`Verse ${row.verse}`}
                >
                  {row.verse}
                </small>{" "}
                {row.text}
              </p>
            ))}
          {result.verses.some((row) => !row.text.trim()) && (
            <p className="label">
              Some verse numbers are omitted in the BSB main text.
            </p>
          )}
        </article>
      ) : (
        <p role="status">Opening the chapter…</p>
      )}
    </Page>
  );
}
