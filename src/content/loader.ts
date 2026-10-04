import { z } from "zod";
import { referencePattern } from "../bible/resolver";
export const scriptureReferenceSchema = z
  .string()
  .trim()
  .regex(
    referencePattern,
    "Use a Scripture reference, such as Romans 8:13 or Psalm 119:9-11.",
  );

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
export const packSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  screenBased: z.boolean(),
  verses: z.array(scriptureReferenceSchema).min(1),
  counsel: z.array(readingSchema).min(1),
  prayers: z
    .array(z.object({ title: z.string().min(1), text: z.string().min(1) }))
    .min(1),
  examinationQuestions: z.array(z.string().min(1)).min(3),
  fleeActions: z.array(z.string().min(1)).min(1),
  afterFallReadings: z.array(readingSchema).min(1),
});
export type Pack = z.infer<typeof packSchema>;
export async function loadJson<T>(
  file: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}content/${file}`);
  if (!response.ok)
    throw new Error(`Could not load ${file}. Please try again when connected.`);
  return schema.parse(await response.json());
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
