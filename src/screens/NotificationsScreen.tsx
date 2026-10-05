import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Page } from "../components/Page";
import { ListGroup, SwitchRow } from "../components/List";
import { useAuth } from "../state/auth";
import { usePreferences } from "../state/preferences";
import { cloud, result } from "../brethren/client";
import { devicePushEnabled, disableWebPush } from "../brethren/push";
import { enableMessages, enableReminders } from "../data/notifications";
import { useBrethren } from "../state/brethren";
import { isNative } from "../native/platform";
import { disableNativePush } from "../native/push";
import { cancelReminders } from "../native/reminders";
import { db } from "../data/db";
import { clock } from "../data/clock";
import { useNotifyState } from "../components/NotifyCard";
import {
  BlockedSteps,
  IphoneInstallSteps,
} from "../components/NotificationHelp";
import { useNotify } from "../state/notify";
import { useCircleWords } from "../brethren/words";
export default function NotificationsScreen() {
  const { circle, Circle } = useCircleWords();
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
    await enableMessages(user);
    setMessages(true);
    await refreshNotify();
  };
  const notify = useNotifyState();
  const refreshNotify = useNotify((s) => s.refresh);
  return (
    <Page
      title="Notifications"
      back={{ to: "/settings", label: "Settings" }}
      lede={`Notifications tell you when your ${circle} ask for prayer, and give a quiet reminder each morning and evening.`}
    >
      {notify === "install" && (
        <article className="card accent">
          <p>
            On iPhone, Mortify can only send notifications once it is on your
            home screen:
          </p>
          <IphoneInstallSteps />
        </article>
      )}
      {notify === "blocked" && (
        <article className="card accent">
          <p>
            Notifications are blocked for Mortify on this phone, so the switches
            below cannot turn them on. To allow them:
          </p>
          <BlockedSteps />
        </article>
      )}
      {notify === "unsupported" && (
        <p className="notice">
          This browser cannot show notifications. On Android, open Mortify in
          Chrome. On iPhone, open it in Safari and add it to your home screen.
        </p>
      )}
      <ListGroup>
        <SwitchRow
          label={`Messages from my ${circle}`}
          detail="Prayer requests and notes from your circle."
          checked={user ? messages : false}
          disabled={!user}
          onChange={async (on) => {
            if (on) await turnOnPush();
            else {
              if (native) await disableNativePush();
              await disableWebPush(user!.id);
              setMessages(false);
              await refreshNotify();
            }
          }}
        />
        <SwitchRow
          label="Morning and evening reminders"
          detail={`Reading at ${clock(prefs.morning)} · Examination at ${clock(prefs.evening)}`}
          checked={native || user ? reminders : false}
          disabled={!native && !user}
          onChange={async (on) => {
            if (on) {
              await enableReminders(user!, prefs);
              // On the web, reminders arrive through this device's notifications.
              if (!native) setMessages(true);
            } else if (native) await cancelReminders();
            else
              await result(
                cloud()
                  .from("reminder_settings")
                  .update({ enabled: false })
                  .eq("user_id", user!.id),
              );
            setReminders(on);
            await refreshNotify();
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
              ? `Sign in to ${Circle} to hear from your circle.`
              : `Sign in to ${Circle} to hear from your circle and to get reminders.`}
          </p>
          <Link className="button block" to="/brethren">
            Open {Circle}
          </Link>
        </article>
      )}
    </Page>
  );
}
