import { z } from "zod";
import { chapterPattern, referencePattern } from "../bible/resolver";
export const scriptureReferenceSchema = z
  .string()
  .trim()
  .regex(
    referencePattern,
    "Use a Scripture reference, such as Romans 8:13 or Psalm 119:9-11.",
  );
/** A whole chapter to read, such as Psalm 51 or Romans 6. */
export const chapterReferenceSchema = z
  .string()
  .trim()
  .regex(chapterPattern, "Use a book and chapter, such as Psalm 51.");

const excerpt = z
  .object({
    text: z.string().min(1),
    author: z.string().min(1),
    source: z.string().min(1),
  })
  .strict();
export const readingSchema = z.union([
  z.object({ ref: scriptureReferenceSchema }).strict(),
  excerpt,
]);
export type Reading = z.infer<typeof readingSchema>;
/** A sermon to hear later, linked to where it is published. */
export const sermonSchema = z
  .object({
    title: z.string().min(1),
    preacher: z.string().min(1),
    church: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    passage: z.string().min(1).optional(),
    url: z.string().regex(/^https:\/\/www\.sermonaudio\.com\//),
  })
  .strict();
export type Sermon = z.infer<typeof sermonSchema>;
export const packSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  screenBased: z.boolean(),
  verses: z.array(scriptureReferenceSchema).min(1),
  /** Whole chapters for the morning, read in turn. */
  chapters: z.array(chapterReferenceSchema).default([]),
  counsel: z.array(readingSchema).min(1),
  prayers: z
    .array(z.object({ title: z.string().min(1), text: z.string().min(1) }))
    .min(1),
  examinationQuestions: z.array(z.string().min(1)).min(3),
  fleeActions: z.array(z.string().min(1)).min(1),
  afterFallReadings: z.array(readingSchema).min(1),
  sermons: z.array(sermonSchema).default([]),
  /** Urgent help shown first in Flee and after a fall, such as a crisis line. */
  help: z
    .object({
      text: z.string().min(1),
      call: z.string().regex(/^\+?[0-9]{3,15}$/),
      label: z.string().min(1),
    })
    .strict()
    .optional(),
});
export type Pack = z.infer<typeof packSchema>;
export async function loadJson<T>(
  file: string,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}content/${file}`);
  if (!response.ok)
    throw new Error(`Could not load ${file}. Please try again when connected.`);
  return schema.parse(await response.json());
}
/** Sermons for every battle: one for the end of Flee, and general ones. */
export const featuredSermonsSchema = z
  .object({
    flee: z.array(sermonSchema),
    general: z.array(sermonSchema),
  })
  .strict();
let featured: Promise<z.infer<typeof featuredSermonsSchema>> | undefined;
export function loadFeaturedSermons() {
  featured ??= loadJson("sermons.json", featuredSermonsSchema).catch((e) => {
    featured = undefined;
    throw e;
  });
  return featured;
}
export async function loadPacks() {
  const files = await loadJson(
    "index.json",
    z.array(z.string().regex(/^[a-z0-9-]+\.json$/)).min(1),
  );
  const packs = await Promise.all(
    files.map((file) => loadJson(file, packSchema)),
  );
  if (new Set(packs.map((p) => p.id)).size !== packs.length)
    throw new Error("Content pack IDs must be unique.");
  return packs;
}
