import { useState } from "react";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { Icon } from "../components/Icon";
import { ListGroup, SwitchRow } from "../components/List";
import { usePrivacy } from "../state/privacy";
import { PinInput } from "../components/PinInput";
import { exportData, deleteDeviceData } from "../privacy/data";
import { isNative } from "../native/platform";
import { biometricAvailable } from "../native/vault";
// Changes that must confirm the current PIN first.
type Pending =
  "lock-off" | "biometric-on" | "biometric-off" | "change-pin" | "new-code";
const confirmLabel: Record<Pending, string> = {
  "lock-off": "Turn off PIN lock",
  "biometric-on": "Use fingerprint or Face ID",
  "biometric-off": "Turn off fingerprint or Face ID",
  "change-pin": "Change PIN",
  "new-code": "Make a new recovery code",
};
export default function PrivacyScreen() {
  const {
    security,
    setLock,
    lock,
    setBiometrics,
    changePin,
    replaceRecoveryCode,
  } = usePrivacy();
  const [pending, setPending] = useState<Pending | null>(null);
  const [pin, setPin] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [done, setDone] = useState("");
  const native = isNative();
  const close = () => {
    setPending(null);
    setPin("");
    setNext("");
    setRepeat("");
  };
  const open = (which: Pending) => {
    close();
    setDone("");
    setPending(which);
  };
  const finish = async () => {
    if (pending === "lock-off") await setLock(false, pin);
    else if (pending === "change-pin") {
      if (next !== repeat) throw new Error("The new PINs do not match.");
      await changePin(pin, next);
      setDone("Your PIN is changed on every phone you use.");
    } else if (pending === "new-code") await replaceRecoveryCode(pin);
    else await setBiometrics(pending === "biometric-on", pin);
    close();
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
              open("lock-off");
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
              open(on ? "biometric-on" : "biometric-off");
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
          <PinInput
            label={
              pending === "change-pin" ? "Current PIN" : "Confirm with your PIN"
            }
            value={pin}
            onChange={setPin}
            autoFocus
          />
          {pending === "change-pin" && (
            <>
              <PinInput label="New PIN" value={next} onChange={setNext} />
              <PinInput
                label="Confirm new PIN"
                value={repeat}
                onChange={setRepeat}
              />
            </>
          )}
          <div className="stack">
            <Action className="primary" run={finish}>
              {confirmLabel[pending]}
            </Action>
            <button type="button" className="quiet" onClick={close}>
              Cancel
            </button>
          </div>
        </form>
      )}
      {done && <p role="status">{done}</p>}
      <ListGroup title="PIN and recovery">
        <li>
          <button className="list-row" onClick={() => open("change-pin")}>
            <span className="tile">
              <Icon name="lock" size={20} />
            </span>
            <span className="row-text">
              Change PIN
              <span className="row-detail">Your journal stays as it is.</span>
            </span>
            <Icon name="chevron" size={18} className="chevron" />
          </button>
        </li>
        <li>
          <button className="list-row" onClick={() => open("new-code")}>
            <span className="tile">
              <Icon name="refresh" size={20} />
            </span>
            <span className="row-text">
              New recovery code
              <span className="row-detail">
                If yours is lost. The old code stops working.
              </span>
            </span>
            <Icon name="chevron" size={18} className="chevron" />
          </button>
        </li>
      </ListGroup>
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
