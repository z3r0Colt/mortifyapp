import { useState } from "react";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { Icon } from "../components/Icon";
import { ListGroup, SwitchRow } from "../components/List";
import { usePrivacy } from "../state/privacy";
import { exportData, deleteDeviceData } from "../privacy/data";
import { isNative } from "../native/platform";
import { biometricAvailable } from "../native/vault";
// Changes that must confirm the PIN before the phone can store the key.
type Pending = "lock-off" | "biometric-on" | "biometric-off";
const confirmLabel: Record<Pending, string> = {
  "lock-off": "Turn off PIN lock",
  "biometric-on": "Use fingerprint or Face ID",
  "biometric-off": "Turn off fingerprint or Face ID",
};
export default function PrivacyScreen() {
  const { security, setLock, lock, setBiometrics } = usePrivacy();
  const [pending, setPending] = useState<Pending | null>(null);
  const [pin, setPin] = useState("");
  const native = isNative();
  const finish = async () => {
    if (pending === "lock-off") await setLock(false, pin);
    else await setBiometrics(pending === "biometric-on", pin);
    setPending(null);
    setPin("");
  };
  return (
    <Page
      title="Privacy"
      back={{ to: "/settings", label: "Settings" }}
      lede="Your journal and confessions are encrypted with your PIN before they leave this phone. Only you can read them, not your brethren and not anyone who runs Mortify."
    >
      <ListGroup>
        <SwitchRow
          label="PIN lock"
          detail="Ask for your PIN each time Mortify opens on this phone. If this is off, anyone who can open Mortify here can read your journal."
          checked={!!security?.lockEnabled}
          onChange={async (on) => {
            if (!on && native) {
              setPending("lock-off");
              return;
            }
            await setLock(on);
          }}
        />
        {native && (
          <SwitchRow
            label="Fingerprint or Face ID"
            detail="Open Mortify without typing your PIN."
            checked={!!security?.biometricEnabled}
            onChange={async (on) => {
              if (on && !(await biometricAvailable()))
                throw new Error(
                  "Set up fingerprint or Face ID in your phone settings first.",
                );
              setPending(on ? "biometric-on" : "biometric-off");
            }}
          />
        )}
      </ListGroup>
      {pending && (
        <form
          className="card fade"
          onSubmit={(e) => {
            e.preventDefault();
            (
              e.currentTarget.querySelector(
                "button.primary",
              ) as HTMLButtonElement | null
            )?.click();
          }}
        >
          <label style={{ marginTop: 0 }}>
            Confirm with your PIN
            <input
              className="pin-input"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              maxLength={12}
              value={pin}
              autoFocus
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            />
          </label>
          <div className="stack">
            <Action className="primary" run={finish}>
              {confirmLabel[pending]}
            </Action>
            <button
              type="button"
              className="quiet"
              onClick={() => {
                setPending(null);
                setPin("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {security?.lockEnabled && (
        <button className="quiet" onClick={lock}>
          <Icon name="lock" size={16} />
          Lock now
        </button>
      )}
      <article className="card">
        <h2>Export your data</h2>
        <p>
          The download includes your private text in a readable form. Keep the
          file somewhere private.
        </p>
        <Action run={exportData}>
          <Icon name="download" size={18} />
          Download my data as JSON
        </Action>
      </article>
      <article className="card">
        <h2>Clear this phone</h2>
        <p>
          Signs you out and removes everything Mortify keeps on this phone. Your
          account and journal stay safe; sign in again to get them back.
        </p>
        <Action
          run={async () => {
            if (window.confirm("Sign out and clear Mortify from this phone?"))
              await deleteDeviceData();
          }}
        >
          Sign out and clear this phone
        </Action>
      </article>
    </Page>
  );
}
