import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Page } from "../components/Page";
import { ListGroup, SwitchRow } from "../components/List";
import { useAuth } from "../state/auth";
import { usePreferences } from "../state/preferences";
import { cloud, result } from "../brethren/client";
import {
  devicePushEnabled,
  disableWebPush,
  enableWebPush,
} from "../brethren/push";
import { useBrethren } from "../state/brethren";
import { isNative } from "../native/platform";
import { disableNativePush, enableNativePush } from "../native/push";
import { scheduleReminders, cancelReminders } from "../native/reminders";
import { db } from "../data/db";
import { clock } from "../data/clock";
import { devicePlatform, isInstalled } from "../platform";
export default function NotificationsScreen() {
  const { profile, load } = useBrethren();
  const user = useAuth((s) => s.user);
  const prefs = usePreferences((s) => s.value);
  const native = isNative();
  const [messages, setMessages] = useState<boolean>();
  const [reminders, setReminders] = useState<boolean>();
  useEffect(() => {
    if (user)
      void devicePushEnabled(user.id)
        .then(setMessages)
        .catch(() => setMessages(false));
    if (native)
      void db.cloudKv
        .get("native-reminders")
        .then((row) => setReminders(row?.value === "on"));
    else if (user)
      void (async () =>
        result(
          cloud()
            .from("reminder_settings")
            .select("enabled")
            .eq("user_id", user.id)
            .maybeSingle(),
        ))()
        .then((row) => setReminders(!!row?.enabled))
        .catch(() => setReminders(false));
  }, [user?.id, native]);
  const turnOnPush = async () => {
    if (!user) return;
    if (native) await enableNativePush(user.id);
    else await enableWebPush(user.id);
    setMessages(true);
  };
  const iphoneBrowser = !native && devicePlatform() === "ios" && !isInstalled();
  return (
    <Page
      title="Notifications"
      back={{ to: "/settings", label: "Settings" }}
      lede="Notifications are optional. Your readings and private entries work without them."
    >
      {iphoneBrowser && (
        <p className="notice">
          On iPhone, add Mortify to your home screen first. Then open it from
          there to turn on notifications.
        </p>
      )}
      <ListGroup>
        <SwitchRow
          label="Messages from my brethren"
          detail="Prayer requests and notes from your circle."
          checked={user ? messages : false}
          disabled={!user}
          onChange={async (on) => {
            if (on) await turnOnPush();
            else {
              if (native) await disableNativePush();
              await disableWebPush(user!.id);
              setMessages(false);
            }
          }}
        />
        <SwitchRow
          label="Morning and evening reminders"
          detail={`Reading at ${clock(prefs.morning)} · Examination at ${clock(prefs.evening)}`}
          checked={native || user ? reminders : false}
          disabled={!native && !user}
          onChange={async (on) => {
            if (native) {
              if (on) {
                if (!(await scheduleReminders(prefs, true)))
                  throw new Error("Notification permission was not granted.");
              } else await cancelReminders();
            } else if (on) {
              // On the web, reminders arrive through this device's notifications.
              await turnOnPush();
              await result(
                cloud().from("reminder_settings").upsert({
                  user_id: user!.id,
                  morning: prefs.morning,
                  evening: prefs.evening,
                  timezone: prefs.timezone,
                  enabled: true,
                }),
              );
            } else
              await result(
                cloud()
                  .from("reminder_settings")
                  .update({ enabled: false })
                  .eq("user_id", user!.id),
              );
            setReminders(on);
          }}
        />
        <SwitchRow
          label="Hide names in notifications"
          detail="Shows “New message” instead of who wrote."
          checked={profile ? !!profile.discreet_notifications : false}
          disabled={!profile}
          onChange={async (on) => {
            await result(
              cloud()
                .from("profiles")
                .update({ discreet_notifications: on })
                .eq("id", user!.id),
            );
            await load();
          }}
        />
      </ListGroup>
      {!native && user && reminders && messages === false && (
        <p className="notice">
          Reminders arrive through notifications on this device. Turn on
          messages above to receive them.
        </p>
      )}
      {!user && (
        <article className="card">
          <p>
            {native
              ? "Sign in to Brethren to hear from your circle."
              : "Sign in to Brethren to hear from your circle and to get reminders."}
          </p>
          <Link className="button block" to="/brethren">
            Open Brethren
          </Link>
        </article>
      )}
    </Page>
  );
}
