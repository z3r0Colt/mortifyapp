import { createClient } from "@supabase/supabase-js";
import { db } from "../data/db";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: {
          storage: {
            getItem: async (key) => (await db.cloudKv.get(key))?.value ?? null,
            setItem: async (key, value) => {
              await db.cloudKv.put({ key, value });
            },
            removeItem: async (key) => {
              await db.cloudKv.delete(key);
            },
          },
        },
      })
    : null;
export function cloud() {
  if (!supabase)
    throw new Error(
      "Mortify cannot reach its server right now. Please try again later.",
    );
  return supabase;
}
export async function result<T>(
  promise: PromiseLike<{
    data: T;
    error: { message: string; code?: string } | null;
  }>,
): Promise<T> {
  const { data, error } = await promise;
  // The database's error code is kept, so a refusal can be told apart from a
  // lost connection.
  if (error)
    throw Object.assign(new Error(error.message), { code: error.code });
  return data;
}
/** True when the database refused the request itself, so retrying is useless. */
export function refused(e: unknown) {
  const code = (e as { code?: unknown } | null)?.code;
  return typeof code === "string" && /^(22|23|42|P0)/.test(code);
}
