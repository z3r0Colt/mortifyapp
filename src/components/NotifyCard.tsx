import { useEffect, useState } from "react";
import { db } from "../data/db";
import { enableMessages, enableReminders } from "../data/notifications";
import { useAuth } from "../state/auth";
import { useNotify } from "../state/notify";
import { usePreferences } from "../state/preferences";
import { Action } from "./Action";
import { Icon } from "./Icon";
import { BlockedSteps, IphoneInstallSteps } from "./NotificationHelp";
import { useCircleWords } from "../brethren/words";
const quiet = 14 * 86400000;
/** Watches whether this phone can receive notifications, rechecking on return. */
export function useNotifyState() {
  const { state, refresh } = useNotify();
  useEffect(() => {
    void refresh();
    const back = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", back);
    return () => document.removeEventListener("visibilitychange", back);
  }, [refresh]);
  return state;
}
// Shown on Home while this phone cannot hear from Mortify. "Not now" rests
// it for two weeks rather than forever, since reminders matter.
export function NotifyCard() {
  const { circle } = useCircleWords();
  const state = useNotifyState();
  const refresh = useNotify((s) => s.refresh);
  const user = useAuth((s) => s.user);
  const prefs = usePreferences((s) => s.value);
  const [resting, setResting] = useState(true);
  useEffect(() => {
    void db.cloudKv
      .get("notify-dismissed")
      .then((row) =>
        setResting(!!row && Date.now() - Number(row.value) < quiet),
      )
      .catch(() => setResting(false));
  }, []);
  if (!state || state === "ready" || resting) return null;
  return (
    <article className="card accent fade">
      <div className="person" style={{ marginBottom: 12 }}>
        <span className="tile">
          <Icon name="bell" size={20} />
        </span>
        <span className="row-text">
          <strong>
            {state === "blocked"
              ? "Notifications are blocked"
              : `Hear when your ${circle} ask for prayer`}
          </strong>
        </span>
      </div>
      {state === "install" && (
        <>
          <p>
            On iPhone, Mortify can only send reminders and prayer requests once
            it is on your home screen.
          </p>
          <IphoneInstallSteps />
        </>
      )}
      {state === "off" && (
        <>
          <p>
            Turn on notifications to hear when your {circle} ask for prayer, and
            for a quiet reminder each morning and evening.
          </p>
          <div className="stack">
            <Action
              className="primary"
              run={async () => {
                if (!user) return;
                await enableReminders(user, prefs);
                await enableMessages(user).catch(() => {});
                await refresh();
              }}
            >
              Turn on notifications
            </Action>
          </div>
        </>
      )}
      {state === "blocked" && (
        <>
          <p>
            Mortify was told not to send notifications on this phone, so you
            will not hear prayer requests or reminders. To allow them:
          </p>
          <BlockedSteps />
        </>
      )}
      {state === "unsupported" && (
        <p>
          This browser cannot show notifications. On Android, open Mortify in
          Chrome. On iPhone, open it in Safari and add it to your home screen.
        </p>
      )}
      <button
        className="quiet"
        onClick={() => {
          setResting(true);
          void db.cloudKv
            .put({ key: "notify-dismissed", value: String(Date.now()) })
            .catch(() => {});
        }}
      >
        Not now
      </button>
    </article>
  );
}
