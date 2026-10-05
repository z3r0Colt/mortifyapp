import { useEffect } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Page } from "../components/Page";
import { Icon } from "../components/Icon";
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
  const target = location.hash.slice("#verse-".length);
  // The chapters either side, crossing into the next or previous book.
  const books = bible ? Object.keys(bible) : [];
  const place = (b: string, c: number) =>
    bible && bible[b]?.[c] ? { book: b, chapter: c } : null;
  const last = (b: string) => Math.max(...Object.keys(bible![b]).map(Number));
  const index = result ? books.indexOf(result.book) : -1;
  const previous = result
    ? (place(result.book, result.chapter - 1) ??
      (index > 0 ? place(books[index - 1], last(books[index - 1])) : null))
    : null;
  const next = result
    ? (place(result.book, result.chapter + 1) ??
      (index >= 0 && index < books.length - 1
        ? place(books[index + 1], 1)
        : null))
    : null;
  return (
    <Page
      calm
      bare
      eyebrow="Berean Standard Bible"
      title={result ? `${result.book} ${result.chapter}` : "Read the chapter"}
      bar={
        location.state?.backgroundLocation ? (
          <button className="back" onClick={() => navigate(-1)}>
            <Icon name="back" size={20} />
            Return to the reading
          </button>
        ) : (
          <Link className="back" to="/bible">
            <Icon name="back" size={20} />
            All books
          </Link>
        )
      }
    >
      {problem ? (
        <p role="alert">{problem}</p>
      ) : result ? (
        <article
          className="chapter-reader"
          aria-label={`${result.book} ${result.chapter} BSB`}
        >
          {result.verses
            .filter((row) => row.text.trim())
            .map((row) => (
              <p
                id={`verse-${row.verse}`}
                key={row.verse}
                className={String(row.verse) === target ? "target" : undefined}
              >
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
          <nav className="chapter-nav" aria-label="Chapters">
            {[previous, next].map((place, i) =>
              place ? (
                <Link
                  key={i}
                  className="button"
                  replace
                  state={location.state}
                  to={`/bible/${encodeURIComponent(place.book)}/${place.chapter}`}
                >
                  {i === 0 && <Icon name="back" size={18} />}
                  {place.book} {place.chapter}
                  {i === 1 && <Icon name="chevron" size={18} />}
                </Link>
              ) : (
                <span key={i} />
              ),
            )}
          </nav>
        </article>
      ) : (
        <p className="label" role="status">
          Opening the chapter…
        </p>
      )}
    </Page>
  );
}
