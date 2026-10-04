import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  canonicalBook,
  resolveChapter,
  resolveReference,
  type Bible,
} from "./resolver";
import { packSchema, scriptureReferenceSchema } from "../content/loader";
const file = readFileSync("public/bible/bsb.json", "utf8");
const bible = JSON.parse(file) as Bible;
const source = JSON.parse(readFileSync("public/bible/source.json", "utf8"));

it("contains the full official download without changes to imported text", () => {
  expect(createHash("sha256").update(file).digest("hex")).toBe(
    source.jsonSha256,
  );
  expect(Object.keys(bible)).toHaveLength(66);
  expect(
    Object.values(bible).reduce(
      (count, book) => count + Object.keys(book).length,
      0,
    ),
  ).toBe(1189);
  const slots = Object.values(bible).flatMap((book) =>
    Object.values(book).flatMap((chapter) => Object.values(chapter)),
  );
  expect(slots).toHaveLength(31102);
  expect(slots.filter((text) => text.trim())).toHaveLength(
    source.versesWithText,
  );
});
describe("BSB references", () => {
  it("returns exact single verses and complete same-chapter ranges", () => {
    expect(resolveReference(bible, "Romans 8:13").text).toBe(
      bible.Romans["8"]["13"],
    );
    const range = resolveReference(bible, "Psalm 119:9-11");
    expect(range.verses.map((row) => row.verse)).toEqual([9, 10, 11]);
    expect(range.text).toBe(
      [9, 10, 11].map((n) => bible.Psalm["119"][n]).join(" "),
    );
  });
  it("supports numbered books, aliases, case, en dashes, and cross-chapter ranges", () => {
    expect(resolveReference(bible, "1 John 2:1–2").verses).toHaveLength(2);
    expect(canonicalBook(bible, "Psalms")).toBe("Psalm");
    expect(resolveReference(bible, "song of songs 1:1").book).toBe(
      "Song of Solomon",
    );
    expect(
      resolveReference(bible, " John 3:36-4:2 ").verses.map((row) => [
        row.chapter,
        row.verse,
      ]),
    ).toEqual([
      [3, 36],
      [4, 1],
      [4, 2],
    ]);
    expect(resolveChapter(bible, "Psalm", 119).verses).toHaveLength(176);
  });
  it.each([
    "Romans 8:999",
    "Romans 99:1",
    "Romans 8:0",
    "Romans 8:15-13",
    "John 4:1-3:36",
    "Unknown 1:1",
    "Romans 8",
    "Matthew 17:21",
  ])("rejects unresolved reference %s", (reference) => {
    expect(() => resolveReference(bible, reference)).toThrow();
  });
  it("preserves official omissions without inventing text for missing verses", () => {
    const passage = resolveReference(bible, "Matthew 17:20-22");
    expect(passage.verses.map((row) => row.verse)).toEqual([20, 22]);
    expect(passage.omitted.map((row) => row.verse)).toEqual([21]);
  });
});

function validateReferences(value: unknown, path: string) {
  if (Array.isArray(value)) {
    value.forEach((item, i) => validateReferences(item, `${path}[${i}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    if (key === "ref" || key === "verses")
      for (const reference of key === "verses"
        ? Array.isArray(item)
          ? item
          : [item]
        : [item]) {
        const parsed = scriptureReferenceSchema.safeParse(reference);
        expect(
          parsed.success,
          `${path}.${key}: ${JSON.stringify(reference)}`,
        ).toBe(true);
        if (parsed.success)
          expect(
            resolveReference(bible, parsed.data).text.trim(),
            `${path}.${key}: ${parsed.data}`,
          ).not.toBe("");
      }
    validateReferences(item, `${path}.${key}`);
  }
}
const packs = JSON.parse(
  readFileSync("public/content/index.json", "utf8"),
) as string[];
for (const filename of readdirSync("public/content").filter(
  (name) => name.endsWith(".json") && name !== "index.json",
)) {
  it(`every Scripture reference in ${filename} resolves to real BSB text`, () => {
    const content = JSON.parse(
      readFileSync(`public/content/${filename}`, "utf8"),
    );
    if (packs.includes(filename)) packSchema.parse(content);
    validateReferences(content, filename);
  });
}
