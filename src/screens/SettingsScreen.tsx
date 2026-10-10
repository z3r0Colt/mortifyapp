import { Page } from "../components/Page";
import { usePreferences } from "../state/preferences";
import { useBattlePacks } from "../content/selection";
import { InstallCard } from "../components/InstallCard";
import { Action } from "../components/Action";
import { Icon } from "../components/Icon";
import { ListGroup, ListLink } from "../components/List";
import { useNotifyState } from "../components/NotifyCard";
import { useAuth } from "../state/auth";
import { usePrivacy } from "../state/privacy";
import { useBrethren } from "../state/brethren";
import { signOut, deleteAccount } from "../brethren/account";
import { sharingChoices } from "../brethren/sharing";
import { exportData, deleteDeviceData } from "../privacy/data";
import { isNative } from "../native/platform";
import { clock } from "../data/clock";
import { heartRoots, occasionTags } from "../data/patterns";
import { useDisplay } from "../state/display";
import { useCircleWords } from "../brethren/words";
// Each row says what is behind it and how it is set now, so no one has to
// open a page to find out what it holds.
export default function SettingsScreen() {
  const { circle } = useCircleWords();
  const value = usePreferences((s) => s.value);
  const user = useAuth((s) => s.user);
  const packs = useBattlePacks();
  const display = useDisplay();
  const notify = useNotifyState();
  const { security, lock } = usePrivacy();
  const { profile, sharing } = useBrethren();
  const screenBased = packs.some((p) => p.screenBased);
  const notifyDetail =
    notify &&
    {
      ready: "On for this phone.",
      off: `Off. You will not hear when your ${circle} ask for prayer.`,
      blocked: "Blocked on this phone. Open to see how to allow them.",
      install: "Add Mortify to your home screen first.",
      unsupported: "This browser cannot show notifications.",
    }[notify];
  const after = security?.lockAfter ?? 1;
  const lockDetail = !security
    ? undefined
    : !security.lockEnabled
      ? "Off. Anyone who opens Mortify on this phone can read your journal."
      : `On. Asks for your ${security.biometricEnabled ? "fingerprint or face" : "PIN"} ${
          after === 0
            ? "each time you come back"
            : `after ${after} minute${after === 1 ? "" : "s"} away`
        }.`;
  const seen = sharing
    ? sharingChoices
        .filter(([key]) => sharing[key])
        .map(([, title]) => title.toLowerCase())
    : [];
  const sharingDetail = !sharing
    ? undefined
    : seen.length
      ? `They see: ${seen.join(", ")}. Never your journal.`
      : "Nothing is shared. They see only your name.";
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
        <ListLink
          to="/notifications"
          icon="bell"
          label="Notifications and reminders"
          detail={notifyDetail ?? undefined}
        />
        <ListLink
          to="/settings/examination"
          icon="pen"
          label="Heart roots and occasions"
          detail={`${(value.heartRoots ?? heartRoots).length} heart roots and ${(value.occasions ?? occasionTags).length} occasions of sin for your evening examination`}
        />
      </ListGroup>
      <h2 className="section-title">Display</h2>
      <article className="card">
        <p className="label" id="theme-label">
          Theme
        </p>
        <div className="segmented" role="group" aria-labelledby="theme-label">
          {(
            [
              ["system", "Match phone"],
              ["light", "Light"],
              ["dark", "Dark"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              aria-pressed={display.theme === value}
              onClick={() => display.set({ theme: value })}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="label" id="text-label">
          Text size
        </p>
        <div
          className="segmented"
          role="group"
          aria-labelledby="text-label"
          style={{ marginBottom: 0 }}
        >
          {(
            [
              ["standard", "Standard"],
              ["large", "Large"],
              ["larger", "Larger"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              aria-pressed={display.text === value}
              onClick={() => display.set({ text: value })}
            >
              {label}
            </button>
          ))}
        </div>
      </article>
      <ListGroup title="Privacy and your journal">
        <ListLink
          to="/privacy"
          icon="lock"
          label="PIN and lock"
          detail={lockDetail}
        />
        <ListLink
          to="/recovery-check"
          icon="check"
          label="Recovery code"
          detail="Opens your journal on a new phone. Check that you still have it."
        />
        {screenBased && (
          <ListLink
            to="/protection"
            icon="shield"
            label="Phone protection"
            detail={
              value.protectionEnabled
                ? "On. Check it now and then with a trusted believer."
                : "Not set up yet. Set it up with a trusted believer."
            }
          />
        )}
        {isNative() && (
          <ListLink
            to="/discreet"
            icon="grid"
            label="Discreet icon"
            detail="Show a plain Notes icon on your home screen."
          />
        )}
      </ListGroup>
      {security?.lockEnabled && (
        <button className="quiet" onClick={lock}>
          <Icon name="lock" size={16} />
          Lock Mortify now
        </button>
      )}
      {user && (
        <ListGroup title={`Your ${circle}`}>
          {profile ? (
            <ListLink
              to="/brethren/sharing"
              icon="eye"
              label={`What your ${circle} see`}
              detail={sharingDetail}
            />
          ) : (
            <ListLink
              to="/brethren"
              icon="people"
              label={`Set up your ${circle}`}
              detail="A few believers from your church who pray for you."
            />
          )}
        </ListGroup>
      )}
      <ListGroup title="Help">
        <ListLink
          to="/about"
          icon="info"
          label="About and help"
          detail="Contact, your data, and credits"
        />
      </ListGroup>
      <InstallCard />
      {user && (
        <>
          <h2 className="section-title">Account and data</h2>
          <article className="card">
            <p className="label">Signed in as {user.email}</p>
            <h3>Download my data</h3>
            <p className="label">
              A copy of everything in your account, with your private text in
              readable form. Keep the file somewhere private.
            </p>
            <Action run={exportData}>
              <Icon name="download" size={18} />
              Download my data
            </Action>
            <h3 style={{ marginTop: 22 }}>Sign out</h3>
            <p className="label">
              Your account and journal stay safe. Sign in again to get them
              back.
            </p>
            <Action run={signOut}>Sign out</Action>
            <Action
              className="quiet"
              run={async () => {
                if (
                  window.confirm("Sign out and clear Mortify from this phone?")
                )
                  await deleteDeviceData();
              }}
            >
              Sign out and clear everything from this phone
            </Action>
            <h3 style={{ marginTop: 22 }}>Delete my account</h3>
            <p className="label">
              Permanently removes everything in your account: your preferences,
              journal, confessions, links with your {circle} and messages.
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
