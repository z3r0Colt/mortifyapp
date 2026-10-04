import { Page } from "../components/Page";
import { usePreferences } from "../state/preferences";
import { useBattlePacks } from "../content/selection";
import { InstallCard } from "../components/InstallCard";
import { Action } from "../components/Action";
import { ListGroup, ListLink } from "../components/List";
import { useAuth } from "../state/auth";
import { signOut, deleteAccount } from "../brethren/account";
import { isNative } from "../native/platform";
import { clock } from "../data/clock";
export default function SettingsScreen() {
  const value = usePreferences((s) => s.value);
  const user = useAuth((s) => s.user);
  const packs = useBattlePacks();
  const screenBased = packs.some((p) => p.screenBased);
  return (
    <Page
      title="Settings"
      lede="Your battles, times and journal are kept in your account. Your journal is encrypted so only you can read it."
    >
      <ListGroup title="Your battles and times">
        <ListLink
          to="/onboarding/battles"
          icon="flag"
          label="Choose battles"
          detail={packs.map((p) => p.name).join(", ") || undefined}
        />
        <ListLink
          to="/onboarding/times"
          icon="clock"
          label="Reading and examination times"
          detail={`Morning ${clock(value.morning)} · Evening ${clock(value.evening)}`}
        />
      </ListGroup>
      <ListGroup title="Privacy and protection">
        <ListLink
          to="/privacy"
          icon="lock"
          label="Privacy, PIN, and your data"
        />
        {screenBased && (
          <ListLink to="/protection" icon="shield" label="Protection setup" />
        )}
        {isNative() && (
          <ListLink to="/discreet" icon="grid" label="Discreet icon" />
        )}
        <ListLink
          to="/notifications"
          icon="bell"
          label="Notifications and reminders"
        />
      </ListGroup>
      <InstallCard />
      {user && (
        <>
          <h2 className="section-title">Account</h2>
          <article className="card">
            <p className="label">Signed in as {user.email}</p>
            <Action run={signOut}>Sign out</Action>
            <p className="label" style={{ marginTop: 18 }}>
              Deleting your account permanently removes everything in it: your
              preferences, journal, confessions, brethren links and messages.
            </p>
            <Action
              run={async () => {
                if (
                  window.confirm(
                    "Permanently delete your Mortify account and everything in it? This cannot be undone.",
                  )
                )
                  await deleteAccount();
              }}
            >
              Delete my account
            </Action>
          </article>
        </>
      )}
    </Page>
  );
}
