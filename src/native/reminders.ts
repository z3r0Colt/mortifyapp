import { LocalNotifications } from "@capacitor/local-notifications";
import { db, type Preferences } from "../data/db";
import { isNative } from "./platform";
export async function scheduleReminders(prefs: Preferences, request = false) {
  if (!isNative()) return false;
  const permission = request
    ? await LocalNotifications.requestPermissions()
    : await LocalNotifications.checkPermissions();
  if (permission.display !== "granted") return false;
  const slot = (time: string) => {
    const [hour, minute] = time.split(":").map(Number);
    return { hour, minute };
  };
  await LocalNotifications.cancel({ notifications: [{ id: 1 }, { id: 2 }] });
  await LocalNotifications.schedule({
    notifications: [
      {
        id: 1,
        title: "Mortify",
        body: "Make room for today's reading.",
        schedule: { on: slot(prefs.morning), repeats: true },
        extra: { url: "/reading" },
      },
      {
        id: 2,
        title: "Mortify",
        body: "Make room for tonight's examination.",
        schedule: { on: slot(prefs.evening), repeats: true },
        extra: { url: "/examine" },
      },
    ],
  });
  await db.cloudKv.put({ key: "native-reminders", value: "on" });
  return true;
}
export async function cancelReminders() {
  if (isNative())
    await LocalNotifications.cancel({ notifications: [{ id: 1 }, { id: 2 }] });
  await db.cloudKv.delete("native-reminders");
}
