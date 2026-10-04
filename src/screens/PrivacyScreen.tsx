import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { Icon } from "../components/Icon";
import { usePrivacy } from "../state/privacy";
import { exportData, deleteDeviceData } from "../privacy/data";
import { useState } from "react";
import { isNative } from "../native/platform";
import { biometricAvailable } from "../native/vault";
export default function PrivacyScreen() {
  const { security, setLock, lock, setBiometrics } = usePrivacy();
  const [pin, setPin] = useState("");
  return (
    <Page
      title="Privacy"
      back={{ to: "/settings", label: "Settings" }}
      lede="Your journal and confessions are encrypted on this device. They never go to your brethren or a server."
    >
      <article className="card">
        <div className="person" style={{ marginBottom: 14 }}>
          <span className="tile">
            <Icon name="lock" size={20} />
          </span>
          <span className="row-text">
            <strong>PIN lock</strong>
            <span
              className={`status-pill${security?.lockEnabled ? " on" : ""}`}
            >
              {security?.lockEnabled ? "On" : "Off"}
            </span>
          </span>
        </div>
        <p className="label">
          Turning off the PIN lock saves an unlocking key on this device. Anyone
          who can open Mortify here can read your text.
        </p>
        {isNative() && (
          <label>
            Current PIN (for native key settings)
            <input
              className="pin-input"
              type="password"
              inputMode="numeric"
              maxLength={12}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
          </label>
        )}
        <div className="stack">
          <Action run={() => setLock(!security?.lockEnabled, pin)}>
            {security?.lockEnabled ? "Turn off PIN lock" : "Turn on PIN lock"}
          </Action>
          {security?.lockEnabled && <button onClick={lock}>Lock now</button>}
          {isNative() && (
            <Action
              run={async () => {
                if (
                  !security?.biometricEnabled &&
                  !(await biometricAvailable())
                )
                  throw new Error(
                    "Set up fingerprint or Face ID in your phone settings first.",
                  );
                await setBiometrics(!security?.biometricEnabled, pin);
                setPin("");
              }}
            >
              {security?.biometricEnabled
                ? "Turn off biometric unlock"
                : "Use fingerprint or Face ID"}
            </Action>
          )}
        </div>
      </article>
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
        <h2>Delete device data</h2>
        <p>
          This permanently removes your local entries, PIN, preferences, and
          offline files.
        </p>
        <Action
          run={async () => {
            if (
              window.confirm(
                "Permanently delete all Mortify data on this device?",
              )
            )
              await deleteDeviceData();
          }}
        >
          Delete everything on this device
        </Action>
      </article>
    </Page>
  );
}
