import type { User } from "@supabase/supabase-js";
import { cloud, result } from "../brethren/client";
import { enableWebPush } from "../brethren/push";
import { isNative } from "../native/platform";
import { enableNativePush } from "../native/push";
import { scheduleReminders } from "../native/reminders";
import type { Preferences } from "./db";
/** Lets this device receive messages from the circle. */
export async function enableMessages(user: User) {
  if (isNative()) await enableNativePush(user.id);
  else await enableWebPush(user.id);
}
/**
 * Turns on the morning and evening reminders. On the phone apps they are
 * scheduled locally; on the web the server sends them to this device.
 */
export async function enableReminders(user: User, prefs: Preferences) {
  if (isNative()) {
    if (!(await scheduleReminders(prefs, true)))
      throw new Error("Notification permission was not granted.");
    return;
  }
  await enableWebPush(user.id);
  await result(
    cloud().from("reminder_settings").upsert({
      user_id: user.id,
      morning: prefs.morning,
      evening: prefs.evening,
      timezone: prefs.timezone,
      enabled: true,
    }),
  );
}
