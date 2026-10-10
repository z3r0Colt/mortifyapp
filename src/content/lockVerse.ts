import { z } from "zod";
import { loadJson, scriptureReferenceSchema } from "./loader";
// The lock screen's verse: from a short general list, never from the user's
// battles, so it says nothing to someone who picks up the phone.
export const lockVersesSchema = z.array(scriptureReferenceSchema).min(1);
export const loadLockVerses = () =>
  loadJson("lock-verses.json", lockVersesSchema);
/** One for each day of the month, as with the Proverbs. */
export function lockVerseFor(list: string[], now = new Date()) {
  return list[(now.getDate() - 1) % list.length];
}
