import { z } from "zod";
import { chapterReferenceSchema, loadJson, type Pack } from "./loader";
import { db } from "../data/db";
import { rotateReading } from "../data/remote";
import { useAuth } from "../state/auth";
import { supabase } from "../brethren/client";
const catechismSchema = z
  .array(
    z.object({
      question: z.string().min(1),
      answer: z.string().min(1),
      source: z.string().min(1),
    }),
  )
  .min(1);
const lordsDayEntry = z.object({
  title: z.string().min(1),
  text: z.string().min(1),
});
export const lordsDaySchema = z.object({
  saturday: lordsDayEntry,
  sunday: lordsDayEntry,
});
// Saturday prepares for the Lord's Day; Sunday is the day itself.
export function lordsDayKey(now: Date) {
  return now.getDay() === 6 ? "saturday" : now.getDay() === 0 ? "sunday" : null;
}
export async function rotate<T>(
  key: string,
  items: T[],
  now = new Date(),
): Promise<T> {
  if (!items.length) throw new Error("No reading is available.");
  // The account keeps the place so every device shows the same reading.
  // Offline, this device carries on from its own copy.
  const user = useAuth.getState().user;
  if (user && supabase && navigator.onLine)
    try {
      const day = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-");
      const index = await rotateReading(key, items.length, day);
      await db.readingHistory.put({ key, index, last: now.getTime() });
      return items[index % items.length];
    } catch {
      /* Fall back to this device's copy. */
    }
  return db.transaction("rw", db.readingHistory, async () => {
    const history = await db.readingHistory.get(key);
    const sameDay =
      history && new Date(history.last).toDateString() === now.toDateString();
    const index = sameDay
      ? history.index % items.length
      : history
        ? (history.index + 1) % items.length
        : 0;
    await db.readingHistory.put({ key, index, last: now.getTime() });
    return items[index];
  });
}
/** A list once over: battles can share a verse or chapter. */
const once = <T>(items: T[]) => [...new Set(items)];
/** The evening psalms, read in turn whatever the battle. */
export const eveningPsalmsSchema = z.array(chapterReferenceSchema).min(1);
/** The old custom of a chapter of Proverbs for each day of the month. */
export function proverbsFor(now: Date) {
  return `Proverbs ${now.getDate()}`;
}
export async function dailyReading(packs: Pack[], now = new Date()) {
  const day = lordsDayKey(now);
  const [catechism, lordsDay] = await Promise.all([
    loadJson("catechism.json", catechismSchema),
    day
      ? loadJson("lords-day.json", lordsDaySchema).then((d) => d[day])
      : Promise.resolve(null),
  ]);
  const group = packs
    .map((p) => p.id)
    .sort()
    .join("-");
  const chapters = once(packs.flatMap((p) => p.chapters));
  const [verse, counsel, question, chapter] = await Promise.all([
    rotate(`verses-${group}`, once(packs.flatMap((p) => p.verses)), now),
    rotate(
      `counsel-${group}`,
      packs.flatMap((p) => p.counsel),
      now,
    ),
    rotate("catechism", catechism, now),
    chapters.length
      ? rotate(`chapters-${group}`, chapters, now)
      : Promise.resolve(null),
  ]);
  return {
    verse,
    counsel,
    question,
    lordsDay,
    chapter,
    proverbs: proverbsFor(now),
  };
}
/** The same list begun halfway through, so the evening never repeats the morning. */
export function halfTurn<T>(items: T[]) {
  const half = Math.floor(items.length / 2);
  return [...items.slice(half), ...items.slice(0, half)];
}
// The evening shares the morning's place in each list but reads from the
// other half of it, so a verse and a word of counsel are fresh each night.
export async function eveningReading(packs: Pack[], now = new Date()) {
  const group = packs
    .map((p) => p.id)
    .sort()
    .join("-");
  const [verse, counsel, psalm] = await Promise.all([
    rotate(
      `verses-${group}`,
      halfTurn(once(packs.flatMap((p) => p.verses))),
      now,
    ),
    rotate(`counsel-${group}`, halfTurn(packs.flatMap((p) => p.counsel)), now),
    loadJson("evening-psalms.json", eveningPsalmsSchema).then((psalms) =>
      rotate("evening-psalm", psalms, now),
    ),
  ]);
  return { verse, counsel, psalm };
}
/** Three of a battle's examination questions, moving on three each night. */
export function questionSets(questions: string[]) {
  const n = questions.length;
  return Array.from({ length: n }, (_, k) =>
    [0, 1, 2].map((i) => questions[(3 * k + i) % n]),
  );
}
