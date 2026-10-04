import { z } from "zod";
import type { Bible } from "./resolver";
const bibleSchema = z.record(
  z.string().min(1),
  z.record(
    z.string().regex(/^[1-9]\d*$/),
    z.record(z.string().regex(/^[1-9]\d*$/), z.string()),
  ),
);
let pending: Promise<Bible> | undefined;
export function loadBible(): Promise<Bible> {
  if (!pending)
    pending = fetch("/bible/bsb.json")
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            "Could not open the BSB Bible. Please try again when connected.",
          );
        return bibleSchema.parse(await response.json());
      })
      .catch((error) => {
        pending = undefined;
        throw error;
      });
  return pending;
}
