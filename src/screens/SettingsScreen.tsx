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
      lede="Your readings and examination are kept on this device."
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
          <h2 className="section-title">Brethren account</h2>
          <article className="card">
            <p className="label">Signed in as {user.email}</p>
            <Action run={signOut}>Sign out</Action>
            <p className="label" style={{ marginTop: 18 }}>
              Deleting your account removes your cloud profile, links, events,
              messages, and push subscriptions. Your local private journal
              remains on this device.
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
        </>
      )}
    </Page>
  );
}
