import { db } from "../data/db";
import { allEntries, fetchPreferences } from "../data/remote";
import { waiting } from "../data/pending";
import { useAuth } from "../state/auth";
import { supabase } from "../brethren/client";
import { decryptText } from "./crypto";
import { journalKey } from "../state/privacy";
import { clearNativeKey } from "../native/vault";
import { cancelReminders } from "../native/reminders";
import { disableNativePush } from "../native/push";
import { shieldStatus, stopShield } from "../native/protection";
import { isNative } from "../native/platform";
import { setDiscreet } from "../native/discreet";
export async function exportData() {
  const key = journalKey();
  const user = useAuth.getState().user;
  if (!user) throw new Error("Sign in first.");
  if (!navigator.onLine)
    throw new Error("Connect to the internet to download your data.");
  const [saved, preferences] = await Promise.all([
    allEntries(user.id),
    fetchPreferences(user.id),
  ]);
  const [waitingJournals, waitingFalls, waitingFlee] = await Promise.all([
    waiting("journals"),
    waiting("falls"),
    waiting("flee_logs"),
  ]);
  const journals = await Promise.all(
    [...saved.journals, ...waitingJournals].map(async ({ body, ...row }) => ({
      ...row,
      text: await decryptText(key, body),
    })),
  );
  const falls = await Promise.all(
    [...saved.falls, ...waitingFalls].map(async (row) => ({
      ...row,
      confession: await decryptText(key, row.confession),
      reflection: await decryptText(key, row.reflection),
    })),
  );
  const fleeLogs = [...saved.fleeLogs, ...waitingFlee];
  const url = URL.createObjectURL(
    new Blob(
      [
        JSON.stringify(
          {
            version: 2,
            exportedAt: new Date().toISOString(),
            account: user.email,
            preferences,
            fleeLogs,
            journals,
            falls,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    ),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `mortify-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
/** Signs out and removes everything Mortify keeps on this device. The account is untouched. */
export async function deleteDeviceData() {
  await supabase?.auth.signOut({ scope: "local" }).catch(() => {});
  if ((await shieldStatus())?.running) await stopShield();
  if (isNative()) await setDiscreet(false);
  await Promise.all([clearNativeKey(), cancelReminders(), disableNativePush()]);
  await db.delete();
  if ("serviceWorker" in navigator)
    for (const registration of await navigator.serviceWorker.getRegistrations())
      await registration.unregister();
  if ("caches" in window)
    for (const key of await caches.keys()) await caches.delete(key);
  window.location.replace(import.meta.env.BASE_URL);
}
