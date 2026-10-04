export type Bible = Record<string, Record<string, Record<string, string>>>;
export type Verse = { chapter: number; verse: number; text: string };
export type Passage = {
  book: string;
  start: { chapter: number; verse: number };
  end: { chapter: number; verse: number };
  verses: Verse[];
  omitted: Verse[];
  text: string;
};
export const referencePattern =
  /^(.+?)\s+([1-9]\d*):([1-9]\d*)(?:\s*[-–—]\s*(?:([1-9]\d*):)?([1-9]\d*))?$/;
export function canonicalBook(bible: Bible, input: string) {
  let name = input.trim().replace(/\s+/g, " ").toLowerCase();
  if (name === "psalms") name = "psalm";
  if (name === "song of songs") name = "song of solomon";
  const book = Object.keys(bible).find((book) => book.toLowerCase() === name);
  if (!book) throw new Error(`Unknown Bible book: ${input}`);
  return book;
}
export function resolveChapter(bible: Bible, input: string, chapter: number) {
  const book = canonicalBook(bible, input);
  const rows = bible[book][chapter];
  if (!Number.isSafeInteger(chapter) || chapter < 1 || !rows)
    throw new Error(`No BSB chapter: ${book} ${chapter}`);
  return {
    book,
    chapter,
    verses: Object.entries(rows)
      .map(([verse, text]) => ({ chapter, verse: Number(verse), text }))
      .sort((a, b) => a.verse - b.verse),
  };
}
export function resolveReference(bible: Bible, reference: string): Passage {
  const match = referencePattern.exec(reference.trim());
  if (!match)
    throw new Error(
      `Invalid Scripture reference: ${reference}. Use Book chapter:verse or a verse range.`,
    );
  const book = canonicalBook(bible, match[1]);
  const start = { chapter: Number(match[2]), verse: Number(match[3]) };
  const end = {
    chapter: match[4] ? Number(match[4]) : start.chapter,
    verse: match[5] ? Number(match[5]) : start.verse,
  };
  for (const point of [start, end]) {
    const rows = resolveChapter(bible, book, point.chapter).verses;
    if (
      !Number.isSafeInteger(point.verse) ||
      !rows.some((row) => row.verse === point.verse)
    )
      throw new Error(`No BSB verse: ${book} ${point.chapter}:${point.verse}`);
  }
  if (
    end.chapter < start.chapter ||
    (end.chapter === start.chapter && end.verse < start.verse)
  )
    throw new Error(`Reversed Scripture range: ${reference}`);
  const requested: Verse[] = [];
  for (let chapter = start.chapter; chapter <= end.chapter; chapter++) {
    requested.push(
      ...resolveChapter(bible, book, chapter).verses.filter(
        (row) =>
          (chapter !== start.chapter || row.verse >= start.verse) &&
          (chapter !== end.chapter || row.verse <= end.verse),
      ),
    );
  }
  const verses = requested.filter((row) => row.text.trim());
  if (!verses.length)
    throw new Error(
      `The official BSB download has no main-text verse at ${reference}.`,
    );
  return {
    book,
    start,
    end,
    verses,
    omitted: requested.filter((row) => !row.text.trim()),
    text: verses.map((row) => row.text).join(" "),
  };
}
