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
  promise: PromiseLike<{ data: T; error: { message: string } | null }>,
): Promise<T> {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return data;
}
