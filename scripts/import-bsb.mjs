import fs from "node:fs/promises";
import { createHash } from "node:crypto";
const url = "https://bereanbible.com/bsb.txt";
const response = await fetch(url);
if (!response.ok) throw new Error(`BSB download failed: ${response.status}`);
const bytes = Buffer.from(await response.arrayBuffer());
await fs.mkdir(".bible-source", { recursive: true });
await fs.writeFile(".bible-source/bsb.txt", bytes);
const lines = bytes
  .toString("utf8")
  .replace(/^\uFEFF/, "")
  .split(/\r?\n/);
const bible = {};
let verses = 0;
for (const line of lines.slice(3)) {
  if (!line) continue;
  const match = /^(.+) ([1-9]\d*):([1-9]\d*)\t(.*)$/.exec(line);
  if (!match) throw new Error(`Invalid BSB row: ${line.slice(0, 70)}`);
  const [, book, chapter, verse, text] = match;
  const chapterText = ((bible[book] ??= {})[chapter] ??= {});
  if (chapterText[verse] !== undefined)
    throw new Error(`Duplicate BSB verse: ${book} ${chapter}:${verse}`);
  chapterText[verse] = text;
  verses++;
}
const books = Object.keys(bible);
const chapters = Object.values(bible).reduce(
  (count, book) => count + Object.keys(book).length,
  0,
);
const omittedReferences = books.flatMap((book) =>
  Object.entries(bible[book]).flatMap(([chapter, rows]) =>
    Object.entries(rows)
      .filter(([, text]) => !text)
      .map(([verse]) => `${book} ${chapter}:${verse}`),
  ),
);
if (books.length !== 66 || chapters !== 1189 || verses !== 31102)
  throw new Error(
    "The download is incomplete or its numbering has changed. Review it before importing.",
  );
const json = JSON.stringify(bible) + "\n";
await fs.mkdir("public/bible", { recursive: true });
await fs.writeFile("public/bible/bsb.json", json);
const hash = (value) => createHash("sha256").update(value).digest("hex");
await fs.writeFile(
  "public/bible/source.json",
  JSON.stringify(
    {
      translation: "Berean Standard Bible",
      abbreviation: "BSB",
      downloadsPage: "https://berean.bible/downloads.htm",
      downloadUrl: url,
      licensingPage: "https://berean.bible/licensing.htm",
      publicDomain: true,
      downloadedAt: new Date().toISOString(),
      sourceSha256: hash(bytes),
      jsonSha256: hash(json),
      books: books.length,
      chapters,
      verses,
      versesWithText: verses - omittedReferences.length,
      omittedReferences,
    },
    null,
    2,
  ) + "\n",
);
console.log({
  books,
  chapters,
  verses,
  omittedReferences,
  jsonBytes: Buffer.byteLength(json),
});
