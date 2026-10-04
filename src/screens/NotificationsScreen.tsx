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
    <Page title="Notifications">
      {!isNative() && (
        <p>
          On iPhone, add Mortify to the home screen before enabling push.
          Permission is optional. Your readings and private entries work without
          it.
        </p>
      )}
      {isNative() && (
        <article className="card">
          <h2>Daily reminders on this phone</h2>
          <p>
            Local reading and examination reminders work without a server or
            internet connection. Android may deliver them later when saving
            battery.
          </p>
          <Action
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
        <div className="stack">
          {profile && (
            <Action
              run={async () => {
                await result(
                  cloud()
                    .from("profiles")
                    .update({
                      discreet_notifications: !profile.discreet_notifications,
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
          <Action
            run={() =>
              isNative() ? enableNativePush(user.id) : enableWebPush(user.id)
            }
          >
            Enable message notifications
          </Action>
          {!isNative() && (
            <Action
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
      ) : (
        <p>
          Sign in and set up your profile in Brethren to enable notifications.
        </p>
      )}
    </Page>
  );
}
