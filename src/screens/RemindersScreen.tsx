import { useNavigate } from "react-router-dom";
import { Page } from "../components/Page";
import { OnboardingBar } from "../components/Steps";
import { Action } from "../components/Action";
import { Icon } from "../components/Icon";
import { IphoneInstallSteps } from "../components/NotificationHelp";
import { useAuth } from "../state/auth";
import { usePreferences } from "../state/preferences";
import { enableMessages, enableReminders } from "../data/notifications";
import { clock } from "../data/clock";
import { devicePlatform, isInstalled } from "../platform";
import { isNative } from "../native/platform";
import { useCircleWords } from "../brethren/words";
import { db } from "../data/db";
// The last onboarding step: a gentle daily nudge back to the Word and prayer.
export default function RemindersScreen() {
  const { circle } = useCircleWords();
  const user = useAuth((s) => s.user);
  const prefs = usePreferences((s) => s.value);
  const navigate = useNavigate();
  const home = () => navigate("/", { replace: true });
  const needsInstall =
    !isNative() && devicePlatform() === "ios" && !isInstalled();
  return (
    <Page
      bare
      title="Reminders"
      lede={`A quiet reminder each morning to read and each evening to examine the day, and a note when your ${circle} ask for prayer.`}
      bar={<OnboardingBar step={8} />}
    >
      <ul className="list">
        <li>
          <div className="list-row">
            <span className="tile">
              <Icon name="sun" size={20} />
            </span>
            <span className="row-text">
              Morning reading
              <span className="row-detail">{clock(prefs.morning)}</span>
            </span>
          </div>
        </li>
        <li>
          <div className="list-row">
            <span className="tile">
              <Icon name="moon" size={20} />
            </span>
            <span className="row-text">
              Evening examination
              <span className="row-detail">{clock(prefs.evening)}</span>
            </span>
          </div>
        </li>
      </ul>
      {needsInstall ? (
        <article className="card">
          <p>On iPhone, reminders work once Mortify is on your home screen:</p>
          <IphoneInstallSteps />
        </article>
      ) : (
        <div className="stack">
          <Action
            className="primary"
            run={async () => {
              if (!user) return;
              await enableReminders(user, prefs);
              // Messages share this device's notifications; a refusal here is not fatal.
              await enableMessages(user).catch(() => {});
              home();
            }}
          >
            Turn on reminders
          </Action>
        </div>
      )}
      <button
        className="quiet"
        onClick={async () => {
          // "Not now" here also rests the card on Home, so the same
          // question is not asked again the moment Home opens.
          await db.cloudKv
            .put({ key: "notify-dismissed", value: String(Date.now()) })
            .catch(() => {});
          home();
        }}
      >
        {needsInstall ? "Continue for now" : "Not now"}
      </button>
      <p className="hint" style={{ justifyContent: "center" }}>
        You can change this anytime in Settings → Notifications.
      </p>
    </Page>
  );
}
