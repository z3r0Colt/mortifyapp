import { useEffect, useState } from "react";
import { Page } from "../components/Page";
import { Action } from "../components/Action";
import { ActionForm } from "../components/ActionForm";
import { Icon } from "../components/Icon";
import { ListGroup, ListLink, SwitchRow } from "../components/List";
import { usePrivacy } from "../state/privacy";
import { PinInput } from "../components/PinInput";
import { isNative } from "../native/platform";
import { biometricAvailable } from "../native/vault";
import { passkeyAvailable } from "../privacy/passkey";
import { useCircleWords } from "../brethren/words";
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
  const { circle } = useCircleWords();
  const {
    security,
    setLock,
    lock,
    setBiometrics,
    changePin,
    replaceRecoveryCode,
    setLockAfter,
  } = usePrivacy();
  const [pending, setPending] = useState<Pending | null>(null);
  const [pin, setPin] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [done, setDone] = useState("");
  const native = isNative();
  // On the web, fingerprint or face unlock works through a passkey where the
  // browser supports it; elsewhere the switch stays hidden.
  const [webBiometric, setWebBiometric] = useState(false);
  useEffect(() => {
    if (!native) void passkeyAvailable().then(setWebBiometric);
  }, [native]);
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
      setDone(
        "Your PIN is changed on this phone. Any other phone keeps its own PIN.",
      );
    } else if (pending === "new-code") await replaceRecoveryCode(pin);
    else await setBiometrics(pending === "biometric-on", pin);
    close();
  };
  return (
    <Page
      title="PIN and lock"
      back={{ to: "/settings", label: "Settings" }}
      lede={`Your journal and confessions are encrypted with your PIN before they leave this phone. Only you can read them, not your ${circle} and not anyone who runs Mortify.`}
    >
      <ListGroup title="Opening Mortify on this phone">
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
        {(native || webBiometric || security?.biometricEnabled) && (
          <SwitchRow
            label="Fingerprint or Face ID"
            detail={
              native
                ? "Open Mortify without typing your PIN."
                : "Open Mortify without typing your PIN. Your phone keeps a passkey for Mortify that works only on this phone."
            }
            checked={!!security?.biometricEnabled}
            onChange={async (on) => {
              if (
                on &&
                !(await (native ? biometricAvailable() : passkeyAvailable()))
              )
                throw new Error(
                  "Set up fingerprint or Face ID in your phone settings first.",
                );
              open(on ? "biometric-on" : "biometric-off");
            }}
          />
        )}
      </ListGroup>
      {pending && (
        <ActionForm className="card fade">
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
        </ActionForm>
      )}
      {security?.lockEnabled && (
        <article className="card">
          <p className="label" id="lock-after-label">
            Ask for my PIN after Mortify has been away for
          </p>
          <div
            className="segmented"
            role="group"
            aria-labelledby="lock-after-label"
            style={{ marginBottom: 0 }}
          >
            {(
              [
                [0, "Right away"],
                [1, "1 min"],
                [5, "5 min"],
                [15, "15 min"],
              ] as const
            ).map(([minutes, label]) => (
              <button
                key={minutes}
                aria-pressed={(security.lockAfter ?? 1) === minutes}
                onClick={() => void setLockAfter(minutes)}
              >
                {label}
              </button>
            ))}
          </div>
        </article>
      )}
      {done && <p role="status">{done}</p>}
      <ListGroup title="PIN and recovery">
        <ListLink
          to="/recovery-check"
          icon="check"
          label="Check my recovery code"
          detail="Make sure the code you kept still opens your journal."
        />
        <li>
          <button className="list-row" onClick={() => open("change-pin")}>
            <span className="tile">
              <Icon name="lock" size={20} />
            </span>
            <span className="row-text">
              Change PIN
              <span className="row-detail">
                For this phone. Your journal stays as it is.
              </span>
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
    </Page>
  );
}
