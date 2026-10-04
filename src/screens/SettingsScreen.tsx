import { Link } from "react-router-dom";
import { Page } from "../components/Page";
import { usePreferences } from "../state/preferences";
import { useBattlePacks } from "../content/selection";
import { InstallCard } from "../components/InstallCard";
import { Action } from "../components/Action";
import { useAuth } from "../state/auth";
import { signOut, deleteAccount } from "../brethren/account";
import { isNative } from "../native/platform";
export default function SettingsScreen() {
  const value = usePreferences((s) => s.value);
  const user = useAuth((s) => s.user);
  const screenBased = useBattlePacks().some((p) => p.screenBased);
  return (
    <Page title="Settings">
      <p>Your readings and examination are kept on this device.</p>
      <p>
        Morning: {value.morning} · Evening: {value.evening}
      </p>
      <div className="stack">
        <Link className="button" to="/onboarding/battles">
          Choose battles
        </Link>
        <Link className="button" to="/onboarding/times">
          Reading and examination times
        </Link>
        <Link className="button" to="/privacy">
          Privacy, PIN, and your data
        </Link>
        {screenBased && (
          <Link className="button" to="/protection">
            Protection setup
          </Link>
        )}
        <Link to="/debug">Content packs</Link>
        {isNative() && (
          <Link className="button" to="/discreet">
            Discreet icon
          </Link>
        )}
        <Link className="button" to="/notifications">
          Notifications and reminders
        </Link>
      </div>
      <InstallCard />
      {user && (
        <article className="card">
          <h2>Brethren account</h2>
          <Action run={signOut}>Sign out</Action>
          <p>
            Deleting your account removes your cloud profile, links, events,
            messages, and push subscriptions. Your local private journal remains
            on this device.
          </p>
          <Action
            run={async () => {
              if (
                window.confirm(
                  "Permanently delete your Mortify brethren account and all its cloud data?",
                )
              )
                await deleteAccount();
            }}
          >
            Delete my account
          </Action>
        </article>
      )}
    </Page>
  );
}
