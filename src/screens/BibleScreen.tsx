import { useState } from "react";
import { Link } from "react-router-dom";
import { Page } from "../components/Page";
import { useContent } from "../content/useContent";
import { loadBible } from "../bible/loader";
// Any book and chapter of the bundled BSB, read in the chapter reader.
export default function BibleScreen() {
  const { data: bible, error } = useContent(loadBible);
  const [book, setBook] = useState<string | null>(null);
  const books = bible ? Object.keys(bible) : [];
  const split = books.indexOf("Matthew");
  const chapters = book && bible ? Object.keys(bible[book]).map(Number) : [];
  return (
    <Page
      title={book ?? "The Bible"}
      eyebrow="Berean Standard Bible"
      back={book ? undefined : { to: "/reading", label: "Today's reading" }}
      bar={
        book ? (
          <button className="back" onClick={() => setBook(null)}>
            All books
          </button>
        ) : undefined
      }
    >
      {error && <p role="alert">{error}</p>}
      {!bible && !error && (
        <p className="label" role="status">
          Opening the Bible…
        </p>
      )}
      {bible && !book && (
        <div className="fade">
          {[
            ["Old Testament", books.slice(0, split)],
            ["New Testament", books.slice(split)],
          ].map(([title, list]) => (
            <section key={title as string}>
              <h2 className="section-title">{title as string}</h2>
              <div className="book-grid">
                {(list as string[]).map((name) => (
                  <button key={name} onClick={() => setBook(name)}>
                    {name}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      {book && (
        <div className="chapter-grid fade" aria-label={`${book} chapters`}>
          {chapters.map((chapter) => (
            <Link
              key={chapter}
              className="button"
              to={`/bible/${encodeURIComponent(book)}/${chapter}`}
              aria-label={`${book} ${chapter}`}
            >
              {chapter}
            </Link>
          ))}
        </div>
      )}
    </Page>
  );
}
