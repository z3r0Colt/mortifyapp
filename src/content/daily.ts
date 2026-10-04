import { z } from "zod";
import { loadJson, type Pack } from "./loader";
import { db } from "../data/db";
const catechismSchema = z
  .array(
    z.object({
      question: z.string().min(1),
      answer: z.string().min(1),
      source: z.string().min(1),
    }),
  )
  .min(1);
export async function rotate<T>(
  key: string,
  items: T[],
  now = new Date(),
): Promise<T> {
  if (!items.length) throw new Error("No reading is available.");
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
export async function dailyReading(packs: Pack[], now = new Date()) {
  const [catechism, lordsDay] = await Promise.all([
    loadJson("catechism.json", catechismSchema),
    now.getDay() === 6
      ? loadJson(
          "lords-day.json",
          z.object({ title: z.string().min(1), text: z.string().min(1) }),
        )
      : Promise.resolve(null),
  ]);
  const group = packs
    .map((p) => p.id)
    .sort()
    .join("-");
  const [verse, counsel, question] = await Promise.all([
    rotate(
      `verses-${group}`,
      packs.flatMap((p) => p.verses),
      now,
    ),
    rotate(
      `counsel-${group}`,
      packs.flatMap((p) => p.counsel),
      now,
    ),
    rotate("catechism", catechism, now),
  ]);
  return { verse, counsel, question, lordsDay };
}
