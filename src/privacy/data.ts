import { db } from "../data/db";
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
  const [preferences, fleeLogs, journals, falls, readingHistory] =
    await Promise.all([
      db.preferences.toArray(),
      db.fleeLogs.toArray(),
      db.journals.toArray(),
      db.falls.toArray(),
      db.readingHistory.toArray(),
    ]);
  const plainJournals = await Promise.all(
    journals.map(async (row) => ({
      ...row,
      text:
        typeof row.text === "string"
          ? row.text
          : await decryptText(key, row.text),
    })),
  );
  const plainFalls = await Promise.all(
    falls.map(async (row) => ({
      ...row,
      confession:
        typeof row.confession === "string"
          ? row.confession
          : await decryptText(key, row.confession),
      reflection:
        typeof row.reflection === "string"
          ? row.reflection
          : await decryptText(key, row.reflection),
    })),
  );
  const url = URL.createObjectURL(
    new Blob(
      [
        JSON.stringify(
          {
            version: 1,
            exportedAt: new Date().toISOString(),
            preferences,
            fleeLogs,
            journals: plainJournals,
            falls: plainFalls,
            readingHistory,
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
export async function deleteDeviceData() {
  if ((await shieldStatus())?.running) await stopShield();
  if (isNative()) await setDiscreet(false);
  await Promise.all([clearNativeKey(), cancelReminders(), disableNativePush()]);
  await db.delete();
  if ("serviceWorker" in navigator)
    for (const registration of await navigator.serviceWorker.getRegistrations())
      await registration.unregister();
  if ("caches" in window)
    for (const key of await caches.keys()) await caches.delete(key);
  window.location.replace("/");
}
