import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import {
  resolveChapterReference,
  resolveReference,
  type Bible,
} from "../bible/resolver";
import { eveningPsalmsSchema, proverbsFor } from "./daily";
import { packSchema } from "./loader";
import index from "../../public/content/index.json";
import psalms from "../../public/content/evening-psalms.json";
import lockVerses from "../../public/content/lock-verses.json";
import { lockVersesSchema } from "./lockVerse";
// Every reference the app can show must open in the bundled BSB.
const bible = JSON.parse(
  readFileSync("public/bible/bsb.json", "utf8"),
) as Bible;
it("every battle's verses and chapters open in the BSB", () => {
  for (const file of index as string[]) {
    const pack = packSchema.parse(
      JSON.parse(readFileSync(`public/content/${file}`, "utf8")),
    );
    for (const ref of pack.verses)
      expect(
        () => resolveReference(bible, ref),
        `${file}: ${ref}`,
      ).not.toThrow();
    for (const ref of pack.chapters)
      expect(
        () => resolveChapterReference(bible, ref),
        `${file}: ${ref}`,
      ).not.toThrow();
    expect(new Set(pack.verses).size, `${file} repeats a verse`).toBe(
      pack.verses.length,
    );
  }
});
it("every evening psalm opens in the BSB", () => {
  for (const ref of eveningPsalmsSchema.parse(psalms))
    expect(() => resolveChapterReference(bible, ref), ref).not.toThrow();
});
it("there is a chapter of Proverbs for every day of the month", () => {
  for (let day = 1; day <= 31; day++) {
    const ref = proverbsFor(new Date(2026, 0, day));
    expect(ref).toBe(`Proverbs ${day}`);
    expect(() => resolveChapterReference(bible, ref)).not.toThrow();
  }
});

it("the lock screen's verses open in the BSB, one for each day", () => {
  const list = lockVersesSchema.parse(lockVerses);
  expect(list.length).toBeGreaterThanOrEqual(31);
  for (const ref of list)
    expect(() => resolveReference(bible, ref), ref).not.toThrow();
});
