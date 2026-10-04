import { db, type PendingEntry } from "./db";
import { uploadEntry } from "./remote";
import { useAuth } from "../state/auth";
let flushing: Promise<void> | null = null;
/** Uploads waiting entries in order, stopping at the first failure. */
export function flushPending() {
  flushing ??= upload().finally(() => {
    flushing = null;
  });
  return flushing;
}
async function upload() {
  const user = useAuth.getState().user;
  if (!user || !navigator.onLine) return;
  for (const item of await db.pending
    .where("userId")
    .equals(user.id)
    .sortBy("time")) {
    try {
      await uploadEntry(user.id, item);
      await db.pending.delete(item.id);
    } catch {
      return;
    }
  }
}
/**
 * Saves an entry to the account. Without a connection it waits on this
 * device and uploads later. Returns whether it reached the account yet.
 */
export async function saveEntry(entry: PendingEntry) {
  const user = useAuth.getState().user;
  if (!user) throw new Error("Sign in to save.");
  await db.pending.put({
    ...entry,
    id: entry.row.id,
    userId: user.id,
    time: Date.now(),
  } as Parameters<typeof db.pending.put>[0]);
  // A flush already under way may have started before this entry was queued.
  if (flushing) await flushing;
  await flushPending();
  return !(await db.pending.get(entry.row.id));
}
/** Entries of one kind still waiting to upload, for showing alongside saved ones. */
export async function waiting<T extends PendingEntry["table"]>(table: T) {
  const user = useAuth.getState().user;
  if (!user) return [];
  const rows = await db.pending.where("userId").equals(user.id).toArray();
  return rows
    .filter((item) => item.table === table)
    .map((item) => item.row) as Extract<PendingEntry, { table: T }>["row"][];
}
export function watchPending() {
  const flush = () => void flushPending();
  const visibility = () => {
    if (document.visibilityState === "visible") flush();
  };
  window.addEventListener("online", flush);
  document.addEventListener("visibilitychange", visibility);
  flush();
  return () => {
    window.removeEventListener("online", flush);
    document.removeEventListener("visibilitychange", visibility);
  };
}
