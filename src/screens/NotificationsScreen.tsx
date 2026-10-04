import { Link } from "react-router-dom";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { useAuth } from "../state/auth";
import { usePreferences } from "../state/preferences";
import { cloud, result } from "../brethren/client";
import { enableWebPush } from "../brethren/push";
import { useBrethren } from "../state/brethren";
import { isNative } from "../native/platform";
import { enableNativePush } from "../native/push";
import { scheduleReminders, cancelReminders } from "../native/reminders";
export default function NotificationsScreen() {
  const { profile, load } = useBrethren();
  const user = useAuth((s) => s.user);
  const prefs = usePreferences((s) => s.value);
  return (
    <Page
      title="Notifications"
      back={{ to: "/settings", label: "Settings" }}
      lede={
        isNative()
          ? undefined
          : "On iPhone, add Mortify to the home screen before enabling push. Permission is optional. Your readings and private entries work without it."
      }
    >
      {isNative() && (
        <article className="card">
          <h2>Daily reminders on this phone</h2>
          <p>
            Local reading and examination reminders work without a server or
            internet connection. Android may deliver them later when saving
            battery.
          </p>
          <Action
            className="primary"
            run={async () => {
              if (!(await scheduleReminders(prefs, true)))
                throw new Error("Notification permission was not granted.");
            }}
          >
            Enable daily reminders
          </Action>
          <Action run={cancelReminders}>Turn off daily reminders</Action>
        </article>
      )}
      {user ? (
        <>
          <article className="card">
            <h2>Messages</h2>
            <p>Hear when your circle asks for prayer or writes to you.</p>
            <div className="stack">
              <Action
                className="primary"
                run={() =>
                  isNative()
                    ? enableNativePush(user.id)
                    : enableWebPush(user.id)
                }
              >
                Enable message notifications
              </Action>
              {profile && (
                <Action
                  run={async () => {
                    await result(
                      cloud()
                        .from("profiles")
                        .update({
                          discreet_notifications:
                            !profile.discreet_notifications,
                        })
                        .eq("id", user.id),
                    );
                    await load();
                  }}
                >
                  {profile.discreet_notifications
                    ? "Show names in notifications"
                    : "Use discreet notifications: New message"}
                </Action>
              )}
            </div>
          </article>
          <article className="card">
            <h2>Reading and examination</h2>
            <p>
              Morning {prefs.morning} · Evening {prefs.evening}
            </p>
            <div className="stack">
              {!isNative() && (
                <Action
                  className="primary"
                  run={() =>
                    result(
                      cloud().from("reminder_settings").upsert({
                        user_id: user.id,
                        morning: prefs.morning,
                        evening: prefs.evening,
                        timezone: prefs.timezone,
                        enabled: true,
                      }),
                    )
                  }
                >
                  Enable reading and examination reminders
                </Action>
              )}
              <Action
                run={() =>
                  result(
                    cloud()
                      .from("reminder_settings")
                      .update({ enabled: false })
                      .eq("user_id", user.id),
                  )
                }
              >
                Turn off server reminders
              </Action>
            </div>
          </article>
        </>
      ) : (
        <article className="card">
          <p>
            Sign in and set up your profile in Brethren to enable notifications.
          </p>
          <Link className="button block" to="/brethren">
            Open Brethren
          </Link>
        </article>
      )}
    </Page>
  );
}
